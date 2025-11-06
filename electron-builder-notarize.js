exports.default = async function (context) {
  const { electronPlatformName } = context;

  if (electronPlatformName !== "darwin") {
    return;
  }

  console.log("Skipping notarization for unsigned macOS build");
  return;
};
