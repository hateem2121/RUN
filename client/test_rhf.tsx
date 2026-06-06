import React from 'react';
import { useForm } from 'react-hook-form';

export function Test() {
  const form = useForm();
  const onSubmit = (data: any) => console.log(data);
  return (
    <form action={form.handleSubmit(onSubmit)}>
      <input {...form.register('test')} />
      <button type="submit">Submit</button>
    </form>
  );
}
