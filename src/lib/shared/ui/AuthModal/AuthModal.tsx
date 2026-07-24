import { Button, ButtonColor } from "@/src/lib/shared/ui/Button";
import { Input } from "@/src/lib/shared/ui/Input";
import { zodResolver } from "@hookform/resolvers/zod";
import { FC, useState } from "react";
import { Resolver, SubmitHandler, useForm } from "react-hook-form";
import { useAuth } from "../../hooks/auth";
import Background from "../Background/Background";
import { Loader } from "../Loader";
import { modal } from "../Modal";
import { SvgClose } from "../svg";
import styles from "./AuthModal.module.scss";
import { AuthSchema, createAuthSchema } from "./auth.schema";

export const AuthModal: FC = () => {
  const { login, signup } = useAuth();
  const [isRegister, setIsRegister] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    clearErrors,
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

  const handleLogin: SubmitHandler<AuthSchema> = (data) => {
    setError(null);
    setIsLoading(true);

    login({
      email: data.email,
      password: data.password,
    })
      .then(() => {})
      .catch(() => {
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
    })
      .then(() => {})
      .catch(() => {
        setIsLoading(false);
      });
  };

  return (
    <div className={styles.container}>
      <form
        onSubmit={
          isRegister ? handleSubmit(handleSignUp) : handleSubmit(handleLogin)
        }
        className={styles.content}
        autoComplete="on"
      >
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
        {error && <p style={{ color: "red" }}>{error}</p>}
        <div className={styles.content__buttons}>
          {isRegister ? (
            <>
              <Button
                color={ButtonColor.ACCENT}
                className={styles.btn}
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? <Loader type="pulse" /> : "Sign up"}
              </Button>
              <p>
                Already have an account?{" "}
                <span onClick={() => switchMode(false)} className={styles.link}>
                  Sign in
                </span>{" "}
              </p>
            </>
          ) : (
            <>
              <Button
                color={ButtonColor.ACCENT}
                className={styles.btn}
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? <Loader type="pulse" /> : "Sign in"}
              </Button>
              <p>
                Don&apos;t have an account?{" "}
                <span onClick={() => switchMode(true)} className={styles.link}>
                  Sign up
                </span>{" "}
              </p>
            </>
          )}
        </div>
      </form>
      <div
        className={styles.close}
        onClick={() => {
          modal.close();
        }}
      >
        <SvgClose className={styles.svg} />
      </div>
      <Background />
    </div>
  );
};
