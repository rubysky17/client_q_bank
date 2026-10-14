import { FieldError, Input, Label, TextField } from 'heroui-native';
import type { ComponentProps } from 'react';
import { type Control, type FieldPath, type FieldValues, useController } from 'react-hook-form';

type InputProps = ComponentProps<typeof Input>;

type FormTextFieldProps<T extends FieldValues> = Omit<
  InputProps,
  'value' | 'onChangeText' | 'onBlur' | 'isInvalid'
> & {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
};

/** react-hook-form field rendered with HeroUI TextField; shows the zod message on error. */
export function FormTextField<T extends FieldValues>({
  control,
  name,
  label,
  ...inputProps
}: FormTextFieldProps<T>) {
  // Destructure up front: `field` carries a ref, and React Compiler rejects reading
  // properties off a ref-holding object during render.
  const {
    field: { ref, value, onChange, onBlur },
    fieldState: { error },
  } = useController({ control, name });

  return (
    <TextField isInvalid={error !== undefined}>
      <Label>{label}</Label>
      <Input ref={ref} value={value} onChangeText={onChange} onBlur={onBlur} {...inputProps} />
      <FieldError>{error?.message}</FieldError>
    </TextField>
  );
}
