import { GetServerSideProps } from "next";
import { parseCookies } from "nookies";
import { FormEvent, useContext, useState } from "react";
import { AuthContext } from "../contexts/AuthContext";
import styles from "../styles/Home.module.css";
import { withSSRGuest } from "../utils/withSSRGuest";

export default function Home() {
  const [formValues, setFormValues] = useState({
    email: "",
    password: "",
  });

  const { signIn } = useContext(AuthContext);

  const { email, password } = formValues;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const data = {
      email,
      password,
    };

    signIn(data);

    setFormValues({
      email: "",
      password: "",
    });
  }

  return (
    <div className={styles.main}>
      <form onSubmit={handleSubmit} className={styles.container}>
        <input
          type="email"
          value={formValues.email}
          onChange={(e) =>
            setFormValues((prev) => ({
              ...prev,
              email: e.target.value,
            }))
          }
        />

        <input
          type="password"
          value={formValues.password}
          onChange={(e) =>
            setFormValues((prev) => ({
              ...prev,
              password: e.target.value,
            }))
          }
        />

        <button type="submit">Entrar</button>
      </form>
    </div>
  );
}

export const getServerSideProps = withSSRGuest(async (ctx) => {

  return {
    props: {},
  };
});
