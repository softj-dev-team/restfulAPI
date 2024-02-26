require('dotenv').config();

// Route 53 클라이언트와 ListHostedZonesCommand를 가져옵니다.
const { Route53Client, ListHostedZonesCommand } = require("@aws-sdk/client-route-53");

const client = new Route53Client({
  // region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});
// 호스트 영역 목록을 가져오는 비동기 함수
async function listHostedZones() {
  try {
    const command = new ListHostedZonesCommand({});
    const response = await client.send(command);
    console.log("호스트 영역 목록:", response.HostedZones);
  } catch (error) {
    console.error("호스트 영역을 가져오는 데 실패했습니다:", error);
  }
}

listHostedZones();