import { TokenProvider } from './token'
import { Backend } from './backend'


function getHomePageHtml(): string {
  return `
    <html>
      <head>
        <title>Q58 Docker镜像服务</title>
        <link rel="shortcut icon" href="https://cdn-oracle.czl.net/img/2024/08/66c8417602ba0.ico">
        <style>
        *{
        font-family: system-ui, -apple-system,BlinkMacSystemFont,'Helvetica Neue',Helvetica,Segoe UI,Arial,Roboto,'PingFang SC',miui,'Hiragino Sans GB','Microsoft Yahei',sans-serif ;
        }  
        body {
            font-family: system-ui, -apple-system,BlinkMacSystemFont,'Helvetica Neue',Helvetica,Segoe UI,Arial,Roboto,'PingFang SC',miui,'Hiragino Sans GB','Microsoft Yahei',sans-serif ;
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            background-image: url('https://random-api.czl.net/pic/all');
            background-size: cover;
            background-position: center;
            color: white;
            text-shadow: 1px 1px 2px black;
          }
          .container {
            background-color: rgba(0, 0, 0, 0.5);
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
            max-width: 600px;
            width: 100%;
          }
          .step {
            margin-bottom: 1em;
          }
          .step label {
            margin-bottom: 0.5em;
            display: block;
          }
          .step .input-group {
            display: flex;
            align-items: center;
          }
          .step textarea,
          .step input {
            flex: 1;
            padding: 10px;
            border-radius: 5px;
            border: none;
            margin-right: 10px;
            color: black;
          }
          .button, .icon-button {
            background-color: #4CAF50;
            color: white;
            padding: 10px 20px;
            margin: 0 10px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            min-width: 40px;
            min-height: 40px;
          }
          .button:hover, .icon-button:hover {
            background-color: #45a049;
          }
          .icon-button i {
            font-size: 18px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>快捷命令</h1>
          <div class="step" style="color:blue;">
          提示，支持docker.io, ghcr,quay,k8sgcr,gcr, 非docker.io需加上域名前缀
          </div>
          <div class="step">
            <label>第一步：输入原始镜像地址获取命令.</label>
            <div class="input-group">
              <input type="text" id="imageInput" placeholder="woodchen/simplemirrorfetch" />
              <button class="button" id="generateButton">获取命令</button>
            </div>
          </div>
          <div class="step">
            <label>第二步：代理拉取镜像</label>
            <div class="input-group">
              <textarea id="dockerPullCommand" readonly></textarea>
              <button class="icon-button" onclick="copyToClipboard('dockerPullCommand')"><i>📋</i></button>
            </div>
          </div>
          <div class="step">
            <label>第三步：重命名镜像</label>
            <div class="input-group">
              <textarea id="dockerTagCommand" readonly></textarea>
              <button class="icon-button" onclick="copyToClipboard('dockerTagCommand')"><i>📋</i></button>
            </div>
          </div>
          <div class="step">
            <label>第四步：删除代理镜像</label>
            <div class="input-group">
              <textarea id="dockerRmiCommand" readonly></textarea>
              <button class="icon-button" onclick="copyToClipboard('dockerRmiCommand')"><i>📋</i></button>
            </div>
          </div>
        </div>
        <script>
          document.addEventListener('DOMContentLoaded', (event) => {
            document.getElementById('generateButton').addEventListener('click', generateCommands);
          });

          function generateCommands() {
            const imageInput = document.getElementById('imageInput').value;
            const source = getSourceFromImage(imageInput);
            const imageName = getImageNameFromInput(imageInput, source);
            const dockerPullCommand = \`docker pull \${source}/\${imageName}\`;
            const dockerTagCommand = \`docker tag \${source}/\${imageName} \${imageName}\`;
            const dockerRmiCommand = \`docker rmi \${source}/\${imageName}\`;

            document.getElementById('dockerPullCommand').value = dockerPullCommand;
            document.getElementById('dockerTagCommand').value = dockerTagCommand;
            document.getElementById('dockerRmiCommand').value = dockerRmiCommand;
          }

          function getSourceFromImage(imageInput) {
            const currentDomain = window.location.hostname;
            if (imageInput.startsWith("gcr.io/")) {
              return \`\${currentDomain}/gcr\`;
            } else if (imageInput.startsWith("k8s.gcr.io/")) {
              return \`\${currentDomain}/k8sgcr\`;
            } else if (imageInput.startsWith("quay.io/")) {
              return \`\${currentDomain}/quay\`;
            } else if (imageInput.startsWith("ghcr.io/")) {
              return \`\${currentDomain}/ghcr\`;
            } else {
              return currentDomain;
            }
          }

          function getImageNameFromInput(imageInput, source) {
            if (imageInput.startsWith("gcr.io/")) {
              return imageInput.replace("gcr.io/", "");
            } else if (imageInput.startsWith("k8s.gcr.io/")) {
              return imageInput.replace("k8s.gcr.io/", "");
            } else if (imageInput.startsWith("quay.io/")) {
              return imageInput.replace("quay.io/", "");
            } else if (imageInput.startsWith("ghcr.io/")) {
              return imageInput.replace("ghcr.io/", "");
            } else {
              return imageInput;
            }
          }

          function copyToClipboard(elementId) {
            const copyText = document.getElementById(elementId);
            copyText.select();
            copyText.setSelectionRange(0, 99999); // For mobile devices
            document.execCommand('copy');
          }
        </script>
      </body>
    </html>
  `;
}



const PROXY_HEADER_ALLOW_LIST: string[] = ["accept", "user-agent", "accept-encoding"]

const validActionNames = new Set(["manifests", "blobs", "tags", "referrers"])

const ORG_NAME_BACKEND: { [key: string]: string; } = {
  "gcr": "https://gcr.io",
  "k8sgcr": "https://k8s.gcr.io",
  "quay": "https://quay.io",
  "ghcr": "https://ghcr.io"
}

const DEFAULT_BACKEND_HOST: string = "https://registry-1.docker.io"

export async function handleRequest(request: Request): Promise<Response> {
  const url = new URL(request.url)
  if (url.pathname === '/') {
    return new Response(getHomePageHtml(), {
      headers: { 'content-type': 'text/html;charset=UTF-8' },
    })
  }

  return handleRegistryRequest(request)
}

function copyProxyHeaders(inputHeaders: Headers): Headers {
  const headers = new Headers;
  for (const pair of inputHeaders.entries()) {
    if (PROXY_HEADER_ALLOW_LIST.includes(pair[0].toLowerCase())) {
      headers.append(pair[0], pair[1])
    }
  }
  return headers;
}

function orgNameFromPath(pathname: string): string | null {
  const splitedPath: string[] = pathname.split("/", 3)
  if (splitedPath.length === 3 && splitedPath[0] === "" && splitedPath[1] === "v2") {
    return splitedPath[2].toLowerCase()
  }
  return null
}

function hostByOrgName(orgName: string | null): string {
  if (orgName !== null && orgName in ORG_NAME_BACKEND) {
    return ORG_NAME_BACKEND[orgName]
  }
  return DEFAULT_BACKEND_HOST
}

function rewritePath(orgName: string | null, pathname: string): string {
  let splitedPath = pathname.split("/");

  // /v2/repo/manifests/xxx -> /v2/library/repo/manifests/xxx
  // /v2/repo/blobs/xxx -> /v2/library/repo/blobs/xxx
  if (orgName === null && splitedPath.length === 5 && validActionNames.has(splitedPath[3])) {
    splitedPath = [splitedPath[0], splitedPath[1], "library", splitedPath[2], splitedPath[3], splitedPath[4]]
  }

  if (orgName === null || !(orgName in ORG_NAME_BACKEND)) {
    return pathname
  }

  const cleanSplitedPath = splitedPath.filter(function (value: string, index: number) {
    return value !== orgName || index !== 2;
  })
  return cleanSplitedPath.join("/")
}

async function handleRegistryRequest(request: Request): Promise<Response> {
  const reqURL = new URL(request.url)
  const orgName = orgNameFromPath(reqURL.pathname)
  const pathname = rewritePath(orgName, reqURL.pathname)
  const host = hostByOrgName(orgName)
  const tokenProvider = new TokenProvider()
  const backend = new Backend(host, tokenProvider)
  const headers = copyProxyHeaders(request.headers)
  return backend.proxy(pathname, { headers: request.headers })
}
