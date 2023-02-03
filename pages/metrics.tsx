import { setupApiClient } from "../services/api";
import { withSSRAuth } from "../utils/withSSRAuth";

const Metrics = () => {
  return (
    <div>
      <h1>Metrics</h1>
    </div>
  );
};

export default Metrics;
 
export const getServerSideProps = withSSRAuth(async (ctx) => {
  const apiClient = setupApiClient(ctx);
  const response = await apiClient.get("/me");

  return {
    props: {},
  };
}, {
    permissions: ["metrics.list"],
    roles: ["administrator"],
});
