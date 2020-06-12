// const grpc = require("grpc");
import path from "path";
import build from "../build";

const PROTO_PATH = path.join(__dirname, "./healthcheck.proto");

const healthcheck = build(PROTO_PATH);
export default healthcheck;
