import { login, signup } from "@/src/lib/shared/api/auth";
import { IAuth } from "@/src/lib/shared/types/auth";
import { Button } from "@/src/lib/shared/ui/Button";
import { FC, useState } from "react";
import { Input } from "@/src/lib/shared/ui/Input";
import { SubmitHandler, useForm } from "react-hook-form";
import styles from "./AuthModal.module.scss";

export const AuthModal: FC = () => {
  const [isRegister, setIsRegister] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { isValid },
  } = useForm<IAuth>({
    mode: "onBlur",
  });

  const handleLogin: SubmitHandler<IAuth> = (data) => {
    setError(null);
    const loginDto: IAuth = {
      email: data.email,
      password: data.password,
    };

    login(loginDto)
      .then((res) => {
        console.log(res);
      })
      .catch((err) => setError(err.message));
  };

  const handleSignUp: SubmitHandler<IAuth> = (data) => {
    // setError(null);
    // const singUpDto: IAuth = {
    //   name: data.name,
    //   email: data.email,
    //   password: data.password,
    // };
    //
    // signup(singUpDto)
    //   .then(() => dispatch(setUser({ email: data.email, user: "123" })))
    //   .catch((err) => setError(err.message));
  };

  return (
    <div className={styles.container}>
      <form
        onSubmit={
          isRegister ? handleSubmit(handleSignUp) : handleSubmit(handleLogin)
        }
        className={styles.content}
      >
        <div className={styles.content__inputs}>
          {isRegister && (
            <div>
              <label>User Name</label>
              <Input type="text" {...register("name", { required: true })} />
            </div>
          )}
          <div>
            <label>Email</label>
            <Input type="email" {...register("email", { required: true })} />
          </div>
          <div>
            <label>Password</label>
            <Input
              type="password"
              {...register("password", { required: true, minLength: 6 })}
            />
          </div>
        </div>
        {error && <p style={{ color: "red" }}>{error}</p>}
        <div className={styles.content__buttons}>
          {isRegister ? (
            <>
              <Button color="accent" type="submit" disabled={!isValid}>
                Sign up
              </Button>
              <p>
                Already have an account?{" "}
                <span
                  onClick={() => setIsRegister(false)}
                  className={styles.link}
                >
                  Sign in
                </span>{" "}
              </p>
            </>
          ) : (
            <>
              <Button color="accent" type="submit" disabled={!isValid}>
                Sign in
              </Button>
              <p>
                Don&apos;t have an account?{" "}
                <span
                  onClick={() => setIsRegister(true)}
                  className={styles.link}
                >
                  Sign up
                </span>{" "}
              </p>
            </>
          )}
        </div>
      </form>
    </div>
  );
};
