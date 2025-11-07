declare module "zod" {
  export interface ZodIssue {
    message: string;
  }

  export interface ZodError {
    errors: ZodIssue[];
  }

  export type SafeParseSuccess<Output> = {
    success: true;
    data: Output;
  };

  export type SafeParseFailure = {
    success: false;
    error: ZodError;
  };

  export type SafeParseReturnType<Input, Output> =
    | SafeParseSuccess<Output>
    | SafeParseFailure;

  export interface ZodType<Output> {
    safeParse(data: unknown): SafeParseReturnType<unknown, Output>;
    optional(): ZodType<Output | undefined>;
    refine(
      check: (value: Output) => boolean,
      params?: { message?: string },
    ): ZodType<Output>;
  }

  export interface ZodString extends ZodType<string> {
    trim(): ZodString;
    min(length: number, message?: string): ZodString;
    email(message?: string): ZodString;
    transform<U>(transformer: (value: string) => U): ZodType<U>;
  }

  export interface ZodEffects<Output> extends ZodType<Output> {}

  export const z: {
    string: (params?: { required_error?: string }) => ZodString;
    object: <Shape extends Record<string, ZodType<any>>>(
      shape: Shape,
    ) => ZodType<{ [K in keyof Shape]: Shape[K] extends ZodType<infer R> ? R : never }>;
    preprocess: <Output>(
      preprocess: (value: unknown) => unknown,
      schema: ZodType<Output>,
    ) => ZodType<Output>;
  };

  export namespace z {
    export type infer<Schema> = Schema extends ZodType<infer Output> ? Output : never;
  }
}
