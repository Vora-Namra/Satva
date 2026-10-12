import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { z } from "zod";
import { api } from "../../../api/axios";
import { ROUTES } from "../../../constants/routes";
import { setCredentials } from "../authSlice";
import type { LoginPayload, LoginResponse } from "../types";
import { useAppDispatch } from "../../../hooks/useAppDispatch";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

export function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || ROUTES.dashboard;

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const loginMutation = useMutation({
    mutationFn: async (payload: LoginPayload) => {
      const response = await api.post<{ data: LoginResponse }>(
        "/auth/login",
        payload,
      );
      return response.data.data;
    },
    onSuccess: (data) => {
      dispatch(setCredentials({ user: data.user, accessToken: data.accessToken }));
      toast.success("Login successful");
      navigate(from, { replace: true });
    },
  });

  return (
    <form className="form" onSubmit={form.handleSubmit((data) => loginMutation.mutate(data))}>
      <div>
        <p className="eyebrow">Welcome back</p>
        <h1>Login</h1>
      </div>
      <label>
        Email
        <input type="email" {...form.register("email")} />
        <span>{form.formState.errors.email?.message}</span>
      </label>
      <label>
        Password
        <input type="password" {...form.register("password")} />
        <span>{form.formState.errors.password?.message}</span>
      </label>
      <button type="submit" disabled={loginMutation.isPending}>
        {loginMutation.isPending ? "Logging in..." : "Login"}
      </button>
    </form>
  );
}
