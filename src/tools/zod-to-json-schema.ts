/**
 * Minimal Zod → JSON Schema converter for our tool input schemas.
 *
 * Supports the subset we actually use: object, string, number, boolean, enum,
 * array, optional, default, nullable. Anything else degrades to `{}`.
 *
 * Avoids pulling in the full `zod-to-json-schema` package to keep the bundle small.
 */
import { z, ZodTypeAny } from 'zod';

interface JsonSchema {
  type?: string;
  description?: string;
  enum?: unknown[];
  items?: JsonSchema;
  properties?: Record<string, JsonSchema>;
  required?: string[];
  additionalProperties?: boolean;
  default?: unknown;
  minimum?: number;
  maximum?: number;
  format?: string;
  nullable?: boolean;
}

export function zodToJsonSchema(schema: ZodTypeAny): JsonSchema {
  return convert(schema);
}

function convert(schema: ZodTypeAny): JsonSchema {
  // Unwrap optional, default, nullable
  if (schema instanceof z.ZodOptional) {
    return convert(schema.unwrap());
  }
  if (schema instanceof z.ZodDefault) {
    const inner = convert(schema._def.innerType);
    return { ...inner, default: schema._def.defaultValue() };
  }
  if (schema instanceof z.ZodNullable) {
    return { ...convert(schema.unwrap()), nullable: true };
  }

  // Primitives
  if (schema instanceof z.ZodString) {
    const result: JsonSchema = { type: 'string' };
    const checks = (schema._def.checks as Array<{ kind: string }>) || [];
    if (checks.some((c) => c.kind === 'url')) result.format = 'uri';
    if (checks.some((c) => c.kind === 'email')) result.format = 'email';
    if (checks.some((c) => c.kind === 'uuid')) result.format = 'uuid';
    if (checks.some((c) => c.kind === 'datetime')) result.format = 'date-time';
    return result;
  }

  if (schema instanceof z.ZodNumber) {
    const result: JsonSchema = { type: 'number' };
    const checks = (schema._def.checks as Array<{ kind: string; value?: number }>) || [];
    for (const c of checks) {
      if (c.kind === 'min' && typeof c.value === 'number') result.minimum = c.value;
      if (c.kind === 'max' && typeof c.value === 'number') result.maximum = c.value;
      if (c.kind === 'int') result.type = 'integer';
    }
    return result;
  }

  if (schema instanceof z.ZodBoolean) {
    return { type: 'boolean' };
  }

  if (schema instanceof z.ZodEnum) {
    return { type: 'string', enum: [...(schema._def.values as string[])] };
  }

  if (schema instanceof z.ZodNativeEnum) {
    const values = Object.values(schema._def.values).filter((v) => typeof v !== 'number');
    return { type: 'string', enum: values };
  }

  if (schema instanceof z.ZodArray) {
    return {
      type: 'array',
      items: convert(schema._def.type),
    };
  }

  if (schema instanceof z.ZodObject) {
    const shape = schema._def.shape() as Record<string, ZodTypeAny>;
    const properties: Record<string, JsonSchema> = {};
    const required: string[] = [];

    for (const [key, value] of Object.entries(shape)) {
      properties[key] = convert(value);
      // Field is required unless it's optional or has a default
      if (!(value instanceof z.ZodOptional) && !(value instanceof z.ZodDefault)) {
        required.push(key);
      }
      // Forward description from .describe() calls
      if (value._def.description) {
        properties[key].description = value._def.description;
      }
    }

    const result: JsonSchema = {
      type: 'object',
      properties,
      additionalProperties: false,
    };
    if (required.length > 0) result.required = required;
    return result;
  }

  if (schema instanceof z.ZodRecord) {
    return { type: 'object', additionalProperties: true };
  }

  if (schema instanceof z.ZodAny || schema instanceof z.ZodUnknown) {
    return {};
  }

  // Fallback
  return {};
}
