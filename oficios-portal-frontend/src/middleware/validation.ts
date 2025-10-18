/**
 * Input Validation Middleware
 * 
 * Provides runtime validation using Zod schemas
 * Ensures type safety and prevents invalid data
 * Based on Context7 security patterns
 * 
 * @module middleware/validation
 * @priority P1
 * @quality Fase 2 (+1.5 points)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z, ZodError, ZodSchema } from 'zod';
import { logger } from '@/lib/logger';

/**
 * Validation error response structure
 */
interface ValidationErrorResponse {
  error: string;
  message: string;
  code: string;
  details: Array<{
    path: string;
    message: string;
    code: string;
  }>;
}

/**
 * Validation middleware with Zod schema
 * 
 * Usage:
 * ```typescript
 * const schema = z.object({
 *   email: z.string().email(),
 *   label: z.string().min(1)
 * });
 * 
 * async function handler(request: NextRequest, validated: z.infer<typeof schema>) {
 *   // validated.email is guaranteed to be valid email
 *   // validated.label is guaranteed to be non-empty string
 * }
 * 
 * export const POST = withValidation(schema, handler);
 * ```
 */
export function withValidation<T>(
  schema: ZodSchema<T>,
  handler: (request: NextRequest, validated: T, ...args: any[]) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: any[]): Promise<NextResponse> => {
    try {
      // Parse request body
      const body = await request.json();

      // Validate against schema
      const validated = schema.parse(body);

      // Call handler with validated data
      return handler(request, validated, ...args);
    } catch (error) {
      if (error instanceof ZodError) {
        // Format validation errors
        const errorResponse: ValidationErrorResponse = {
          error: 'Validation failed',
          message: 'The request body contains invalid data',
          code: 'VALIDATION_ERROR',
          details: error.errors.map(err => ({
            path: err.path.join('.'),
            message: err.message,
            code: err.code
          }))
        };

        // Log validation error
        logger.warn('Request validation failed', {
          url: request.url,
          method: request.method,
          errors: errorResponse.details
        });

        return NextResponse.json(errorResponse, {
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        });
      }

      if (error instanceof SyntaxError) {
        // Invalid JSON
        return NextResponse.json(
          {
            error: 'Invalid JSON',
            message: 'The request body is not valid JSON',
            code: 'INVALID_JSON'
          },
          { status: 400 }
        );
      }

      // Unknown error - rethrow
      throw error;
    }
  };
}

/**
 * Common validation schemas
 */
export const schemas = {
  /**
   * Gmail sync request schema
   */
  gmailSync: z.object({
    email: z.string()
      .email('Invalid email format')
      .max(255, 'Email too long'),
    label: z.string()
      .min(1, 'Label cannot be empty')
      .max(50, 'Label too long')
      .regex(/^[A-Z_]+$/, 'Label must be uppercase letters and underscores only')
  }),

  /**
   * Ofício ID parameter schema
   */
  oficioId: z.object({
    id: z.string()
      .uuid('Invalid ofício ID format')
      .or(z.string().regex(/^[a-zA-Z0-9_-]+$/, 'Invalid ofício ID'))
  }),

  /**
   * Pagination schema
   */
  pagination: z.object({
    page: z.number().int().positive().default(1),
    limit: z.number().int().positive().max(100).default(20),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).default('desc')
  }),

  /**
   * Date range schema
   */
  dateRange: z.object({
    startDate: z.string().datetime().or(z.date()),
    endDate: z.string().datetime().or(z.date())
  }).refine(
    data => new Date(data.startDate) <= new Date(data.endDate),
    'Start date must be before or equal to end date'
  )
};

/**
 * Validate query parameters
 */
export function validateQueryParams<T>(
  schema: ZodSchema<T>,
  request: NextRequest
): T | NextResponse {
  try {
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams);
    
    return schema.parse(params);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid query parameters',
          details: error.errors
        },
        { status: 400 }
      );
    }
    throw error;
  }
}

