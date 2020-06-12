import grpc from "grpc";
import fs from "fs";

import generateMeta from "./utils/generateMeta";
import getMethodType from "./utils/getMethodType";

import unaryCall from "./clientCalls/unaryCall";
import clientStreamCall from "./clientCalls/clientStreamCall";
import serverStreamCall from "./clientCalls/serverStreamCall";
import duplexCall from "./clientCalls/duplexCall";

/**
 * @class The Stub constructor generates an instance of Firecomm's Stub class, which extends the native gRPC client-service instance.
 *
 * @param {Object} serviceDefinition `.proto` packaged and built service definition in the form of a proto-loaded JS object
 *
 * @param {String} Socket socket in the form of `IP`:`PORT`
 *
 * @param {Object} [config] Optional parameter. An Object with the following options: certificate: PATH string // file path to SSL certificate
 *
 *
 * @returns {Object} an instance of the Firecomm Stub class
 *
 */
export default function Stub(serviceDefinition, port, config) {
  class Stub extends serviceDefinition {
    constructor(port, securitySettings, options) {
      super(port, securitySettings, options);

      // serviceDefinition is from routeGuide
      this.serviceDefinition = serviceDefinition;

      // methods would look something like this: [ 'UnaryChat', 'ServerStream',
      // 'ClientStream', 'BidiChat' ]
      const methods = Object.keys(this.serviceDefinition.service);
      for (let i = 0; i < methods.length; i++) {
        this.assignMethod(methods[i]);
      }
    }

    /**
     * input should be a method name, such as:
     * Duplex / ClientStream / ServerStream / Unary
     * @param {*} methodName
     */
    assignMethod(methodName) {
      // console.log({methodName});
      // console.log({serviceDef: this.serviceDefinition});
      const method = this.serviceDefinition.service[methodName];

      // getMethodType will find which type of session connection -> Duplex /
      // ClientStream / ServerStream / Unary
      const methodType = getMethodType(method);

      const lowerCaseName =
        methodName[0].toLowerCase() + methodName.substring(1);

      if (methodType === "Unary") {
        // 'message' will always be an object with *any* kind of data as properties that fit the .proto file
        // configuation
        this[lowerCaseName] = function (metaObject, interceptorArray) {
          const that = this;
          return unaryCall(that, methodName, metaObject, interceptorArray);
        };
      } else if (methodType === "ClientStream") {
        this[lowerCaseName] = function (metaObject, interceptorArray) {
          const that = this;
          return clientStreamCall(
            that,
            methodName,
            metaObject,
            interceptorArray
          );
        };
      } else if (methodType === "ServerStream") {
        this[lowerCaseName] = function (metaObject, interceptorArray) {
          const that = this;
          return serverStreamCall(
            that,
            methodName,
            metaObject,
            interceptorArray
          );
          //   const metadata = generateMeta(metaObject);
          //   const interceptors = { interceptors: interceptorArray };
          //   return this[methodName](message, metadata, interceptors);
        };
      } else if (methodType === "Duplex") {
        // console.log({methodName});
        this[lowerCaseName] = function (metaObject, interceptorArray) {
          const that = this;
          return duplexCall(that, methodName, metaObject, interceptorArray);
          // const metadata = generateMeta(metaObject);
          // const interceptors = { interceptors: interceptorArray };
          // return this[methodName](metadata, interceptors);
        };
      } else {
        throw new Error("Method type undefined.");
      }
    }
  }

  if (config === undefined) {
    return new Stub(port, grpc.credentials.createInsecure());
  } else {
    // destructure security options off of config
    const { certificate: unreadCertificate } = config;
    // delete certificate to not pollute config object
    delete config["certificate"];
    const readCertificate = fs.readFileSync(unreadCertificate);
    return new Stub(port, grpc.credentials.createSsl(readCertificate), config);
  }
}
