export default function (customCall, originalCall) {
  customCall.call = originalCall;
  customCall.state = null;
  customCall.head = originalCall.metadata;
  customCall.getPeer = function () {
    return originalCall.getPeer();
  };
}
