import { ChangeEvent, FC, useState } from "react";
import styles from "./SingUp.module.scss";
import { Button } from "@/src/lib/shared/ui/Button";
import { useAppDispatch } from "@/src/lib/app/store";
import { setUser } from "@/src/lib/app/store/slices/authSlice";
import { signup } from "@/src/lib/shared/api/auth";
import { SignUpDto } from "@/src/lib/shared/types/auth";
import { Input } from "@/src/lib/shared/ui/Input";
import { useRouter } from "next/router";

const SingUp: FC = () => {
  const dispatch = useAppDispatch();

  const router = useRouter();

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const handleEmailChange = (e: ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  const handleUserNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  };

  const handleSignUp = async () => {
    setError(null);
    const signUpDto: SignUpDto = { name, email, password };
    await signup(signUpDto)
      .then((res) => {
        console.log(res.user.email);
        dispatch(
          setUser({
            id: res.user._id,
            email: res.user.email,
            user: res.user.name,
          })
        );
        router.push(`/user/${res.user._id}`)
      })
      .catch((err) => {
        setError(err.message);
      });
  };

  return (
    <div className={styles.container}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSignUp();
        }}
        className={styles.content}
      >
        <h1>Sign up</h1>
        <div>
          <label>Email</label>
          <Input
            value={email}
            onChange={handleEmailChange}
            type="email"
            required
          />
        </div>
        <div>
          <label>Password</label>
          <Input
            value={password}
            onChange={handlePasswordChange}
            type="password"
            required
          />
        </div>
        <div>
          <label>Username</label>
          <Input value={name} onChange={handleUserNameChange} required />
        </div>
        {error && <p style={{ color: "red" }}>{error}</p>}
        <Button type="submit" color="accent">
          Sign up
        </Button>
      </form>
    </div>
  );
};

export default SingUp;
