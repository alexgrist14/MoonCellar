import { AUTH_MODAL_ID } from "@/src/lib/shared/constants";
import { Button, ButtonColor } from "@/src/lib/shared/ui/Button";
import { Input } from "@/src/lib/shared/ui/Input";
import { zodResolver } from "@hookform/resolvers/zod";
import { isAxiosError } from "axios";
import { ChangeEvent, FC, useState } from "react";
import { Resolver, SubmitHandler, useForm } from "react-hook-form";
import { useAuth } from "@/src/lib/shared/hooks/auth";
import { Background } from "../Background";
import { useMinimumLoading } from "@/src/lib/shared/hooks/useMinimumLoading";
import { modal } from "../Modal";
import { SvgClose } from "../svg";
import styles from "./AuthModal.module.scss";
import { AuthSchema, createAuthSchema } from "./auth.schema";

const getErrorMessage = (error: unknown, fallback: string) => {
  const message = isAxiosError(error)
    ? error.response?.data?.message
    : undefined;

  if (Array.isArray(message)) return message.join(", ");

  return typeof message === "string" ? message : fallback;
};

export const openAuthModal = () =>
  modal.open(<AuthModal />, { id: AUTH_MODAL_ID });

export const AuthModal: FC = () => {
  const { login, signup } = useAuth();
  const [isRegister, setIsRegister] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const isLoaderShown = useMinimumLoading(isLoading);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    clearErrors,
    setValue,
  } = useForm<AuthSchema>({
    resolver: (async (values, context, options) => {
      return zodResolver(createAuthSchema(isRegister))(
        values,
        context,
        options
      );
    }) as Resolver<AuthSchema>,
    mode: "onBlur",
  });

  const switchMode = (registerMode: boolean) => {
    setIsRegister(registerMode);
    setError(null);
    clearErrors();
    reset();
  };

  const onSubmit = (e: ChangeEvent<HTMLFormElement>) => {
    new FormData(e.currentTarget).forEach((value, key) =>
      setValue(key as keyof AuthSchema, String(value))
    );
    return handleSubmit(isRegister ? handleSignUp : handleLogin)(e);
  };

  const handleLogin: SubmitHandler<AuthSchema> = (data) => {
    setError(null);
    setIsLoading(true);

    login({
      email: data.email,
      password: data.password,
    }).catch((err) => {
      setError(getErrorMessage(err, "Sign in failed"));
      setIsLoading(false);
    });
  };

  const handleSignUp: SubmitHandler<AuthSchema> = (data) => {
    if (!data.userName) return;

    setError(null);
    setIsLoading(true);

    signup({
      userName: data.userName,
      email: data.email,
      password: data.password,
    }).catch((err) => {
      setError(getErrorMessage(err, "Sign up failed"));
      setIsLoading(false);
    });
  };

  return (
    <div className={styles.container}>
      <form onSubmit={onSubmit} className={styles.content} autoComplete="on">
        <div className={styles.content__inputs}>
          {isRegister && (
            <div>
              <label>User Name</label>
              <Input
                type="text"
                {...register("userName")}
                error={errors.userName}
              />
            </div>
          )}
          <div>
            <label>Email</label>
            <Input
              type="email"
              id="email"
              autoComplete="username"
              {...register("email")}
              error={errors.email}
            />
          </div>
          <div>
            <label>Password</label>
            <Input
              type="password"
              id="password"
              autoComplete="current-password"
              {...register("password")}
              error={errors.password}
            />
          </div>
        </div>
        {error && <p className={styles.error}>{error}</p>}
        <div className={styles.content__buttons}>
          <Button
            color={ButtonColor.ACCENT}
            className={styles.btn}
            type="submit"
            isLoading={isLoaderShown}
          >
            {isRegister ? "Sign up" : "Sign in"}
          </Button>
          <p className={styles.switch}>
            {isRegister ? "Already have an account?" : "Don't have an account?"}
            <Button
              type="button"
              color={ButtonColor.TRANSPARENT}
              className={styles.link}
              compact
              onClick={() => switchMode(!isRegister)}
            >
              {isRegister ? "Sign in" : "Sign up"}
            </Button>
          </p>
        </div>
      </form>
      <Button
        type="button"
        color={ButtonColor.TRANSPARENT}
        className={styles.close}
        tooltip="Close"
        tooltipAlign="right"
        onClick={() => modal.close(AUTH_MODAL_ID)}
      >
        <SvgClose size="20" />
      </Button>
      <Background />
    </div>
  );
};
