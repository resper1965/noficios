"""
Módulo de autenticação e controle de acesso baseado em papéis (RBAC).
Implementa decoradores para validação de permissões em Cloud Functions.
"""
import os
from datetime import datetime
from functools import wraps
from typing import Callable, List, Optional

import firebase_admin
from firebase_admin import auth, credentials
from flask import Request

# Inicializa o Firebase Admin SDK (se ainda não inicializado)
try:
    firebase_admin.get_app()
except ValueError:
    # Inicializa com credenciais padrão do ambiente
    cred = credentials.ApplicationDefault()
    firebase_admin.initialize_app(cred)


# Constantes de Papéis (Roles)
ROLE_PLATFORM_ADMIN = "platform_admin"
ROLE_ORG_ADMIN = "org_admin"
ROLE_USER = "user"

ALL_ROLES = [ROLE_PLATFORM_ADMIN, ROLE_ORG_ADMIN, ROLE_USER]


class AuthContext:
    """Contexto de autenticação do usuário"""
    
    def __init__(
        self, 
        user_id: str, 
        org_id: str, 
        role: str, 
        email: Optional[str] = None,
        custom_claims: Optional[dict] = None
    ):
        self.user_id = user_id
        self.org_id = org_id
        self.role = role
        self.email = email
        self.custom_claims = custom_claims or {}
        self.timestamp = datetime.utcnow()
    
    def is_platform_admin(self) -> bool:
        """Verifica se o usuário é administrador da plataforma"""
        return self.role == ROLE_PLATFORM_ADMIN
    
    def is_org_admin(self) -> bool:
        """Verifica se o usuário é administrador da organização"""
        return self.role in [ROLE_PLATFORM_ADMIN, ROLE_ORG_ADMIN]
    
    def can_access_org(self, target_org_id: str, allow_cross_org: bool = False) -> bool:
        """
        Verifica se o usuário pode acessar recursos de uma organização.
        
        Args:
            target_org_id: ID da organização alvo
            allow_cross_org: Se True, platform_admin pode acessar qualquer org
            
        Returns:
            True se acesso permitido
        """
        # Platform admin com permissão cross-org pode acessar qualquer organização
        if allow_cross_org and self.is_platform_admin():
            return True
        
        # Caso contrário, deve ser da mesma organização
        return self.org_id == target_org_id
    
    def to_dict(self) -> dict:
        """Converte o contexto para dicionário"""
        return {
            'user_id': self.user_id,
            'org_id': self.org_id,
            'role': self.role,
            'email': self.email,
            'timestamp': self.timestamp.isoformat()
        }


def extract_token_from_request(request: Request) -> str:
    """
    Extrai o token JWT do header Authorization da requisição.
    
    Args:
        request: Objeto Request do Flask
        
    Returns:
        Token JWT
        
    Raises:
        ValueError: Se o token não for encontrado ou formato inválido
    """
    auth_header = request.headers.get('Authorization', '')
    
    if not auth_header:
        raise ValueError("Header Authorization não fornecido")
    
    # Formato esperado: "Bearer <token>"
    parts = auth_header.split(' ')
    
    if len(parts) != 2 or parts[0].lower() != 'bearer':
        raise ValueError("Formato de Authorization inválido. Esperado: 'Bearer <token>'")
    
    return parts[1]


def verify_and_decode_token(token: str) -> AuthContext:
    """
    Verifica e decodifica um token JWT do Firebase.
    
    Args:
        token: Token JWT
        
    Returns:
        AuthContext com informações do usuário
        
    Raises:
        ValueError: Se o token for inválido ou não contiver claims necessários
    """
    try:
        # Verifica o token usando Firebase Admin SDK
        decoded_token = auth.verify_id_token(token)
        
        # Extrai informações básicas
        user_id = decoded_token.get('uid')
        email = decoded_token.get('email')
        
        # Extrai custom claims (org_id e role)
        org_id = decoded_token.get('org_id')
        role = decoded_token.get('role', ROLE_USER)
        
        if not user_id:
            raise ValueError("Token não contém 'uid'")
        
        if not org_id:
            raise ValueError("Token não contém 'org_id' nos custom claims")
        
        if role not in ALL_ROLES:
            raise ValueError(f"Role inválido: {role}")
        
        return AuthContext(
            user_id=user_id,
            org_id=org_id,
            role=role,
            email=email,
            custom_claims=decoded_token
        )
        
    except auth.InvalidIdTokenError as e:
        raise ValueError(f"Token inválido: {e}")
    except Exception as e:
        raise ValueError(f"Erro ao verificar token: {e}")


def rbac_required(
    allowed_roles: List[str],
    allow_cross_org: bool = False,
    resource_org_id_param: Optional[str] = None
):
    """
    Decorador para validar autorização RBAC em Cloud Functions HTTP.
    
    Args:
        allowed_roles: Lista de roles permitidos para acessar a função
        allow_cross_org: Se True, platform_admin pode acessar recursos de outras orgs
        resource_org_id_param: Nome do parâmetro que contém o org_id do recurso
                               (ex: 'org_id' para validar acesso a recursos específicos)
    
    Usage:
        @rbac_required(allowed_roles=[ROLE_ORG_ADMIN, ROLE_PLATFORM_ADMIN])
        def minha_funcao(request, auth_context):
            # auth_context é injetado automaticamente
            return {'status': 'success'}
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(request: Request, *args, **kwargs):
            try:
                # 1. Extrai o token JWT do header
                token = extract_token_from_request(request)
                
                # 2. Verifica e decodifica o token
                auth_context = verify_and_decode_token(token)
                
                # 3. Verifica se o role está permitido
                if auth_context.role not in allowed_roles:
                    return {
                        'error': 'Acesso negado',
                        'message': f'Role {auth_context.role} não tem permissão para esta operação',
                        'required_roles': allowed_roles
                    }, 403
                
                # 4. Valida acesso ao recurso específico (se aplicável)
                if resource_org_id_param:
                    # Tenta obter org_id do recurso dos parâmetros da requisição
                    request_data = request.get_json(silent=True) or {}
                    request_args = request.args.to_dict()
                    
                    resource_org_id = (
                        request_data.get(resource_org_id_param) or 
                        request_args.get(resource_org_id_param)
                    )
                    
                    if resource_org_id:
                        if not auth_context.can_access_org(resource_org_id, allow_cross_org):
                            return {
                                'error': 'Acesso negado',
                                'message': f'Você não tem permissão para acessar recursos da organização {resource_org_id}'
                            }, 403
                
                # 5. Injeta o auth_context na função
                kwargs['auth_context'] = auth_context
                
                # 6. Executa a função
                return func(request, *args, **kwargs)
                
            except ValueError as e:
                return {
                    'error': 'Autenticação falhou',
                    'message': str(e)
                }, 401
            except Exception as e:
                return {
                    'error': 'Erro interno',
                    'message': f'Erro ao processar autenticação: {str(e)}'
                }, 500
        
        return wrapper
    return decorator


def require_same_org(func: Callable) -> Callable:
    """
    Decorador simplificado que garante que o usuário só acesse recursos da própria org.
    Requer que a função tenha 'auth_context' e 'org_id' nos parâmetros.
    """
    @wraps(func)
    def wrapper(*args, **kwargs):
        auth_context = kwargs.get('auth_context')
        org_id = kwargs.get('org_id')
        
        if not auth_context or not org_id:
            raise ValueError("Decorador require_same_org requer auth_context e org_id")
        
        if auth_context.org_id != org_id and not auth_context.is_platform_admin():
            raise PermissionError(
                f"Acesso negado: usuário da org {auth_context.org_id} "
                f"tentou acessar recurso da org {org_id}"
            )
        
        return func(*args, **kwargs)
    
    return wrapper





