import Stub from "./Stub";
import healthcheck from "./custom-services/healthcheck-pkg";
class HealthStub extends Stub {
  constructor(port) {
    super(healthcheck.HealthCheck, port);
  }
}

export default HealthStub;
