import Router from "next/router";
import { useContext } from "react";
import { Can } from "../components/Can";
import { AuthContext } from "../contexts/AuthContext";
import { setupApiClient } from "../services/api";
import { withSSRAuth } from "../utils/withSSRAuth";

const Dashboard = () => {
  const { user, signOut } = useContext(AuthContext);

  function handleSignOut() {
    signOut();
    Router.push("/");
    console.log("signOut");
  }

  return (
    <div>
      <h1>Dashboard {user?.email}</h1>
      <button onClick={handleSignOut}>SignOut</button>

      <Can permissions={["metrics.list"]}>
        <div>Métricas</div>
      </Can>
    </div>
  );
};

export default Dashboard;

export const getServerSideProps = withSSRAuth(async (ctx) => {
  const apiClient = setupApiClient(ctx);
  const response = await apiClient.get("/me");

  return {
    props: {},
  };
});
