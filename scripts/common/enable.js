/* --------------------------------------------------------------------------
   Extension Enable/Disable Check
   -------------------------------------------------------------------------- */

async function checkEnable() {
  const enable = await getObjectFromLocalStorage("DashHubEnable");
  if (!enable) {
    writeEnableMsgOnLog();
  }
  return enable;
}

function writeEnableMsgOnLog() {
  console.log("확장이 활성화되지 않았습니다. 확장을 활성화하고 시도해주세요");
}
