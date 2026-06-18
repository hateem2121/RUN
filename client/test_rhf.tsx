import { useForm } from "react-hook-form";

export function Test() {
  const form = useForm();
  const onSubmit = (data: unknown) => console.log(data);
  return (
    <form action={form.handleSubmit(onSubmit)}>
      <input {...form.register("test")} />
      <button type="submit">Submit</button>
    </form>
  );
}
