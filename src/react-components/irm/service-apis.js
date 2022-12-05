const MAS_Endpoint = {
    authVerify      : ()   => "auth/verify",
    rolePermissions : role => `permission/${role}`
};

const Header_X_API_KEY = "x-api-key";

class ServiceMAS
{
    constructor(apiDomain) {
        this.mBaseUrl = `${apiDomain}/mas`;
    }

    async authVerify(authToken, responseCB, errorCB)
    {
        this.post(MAS_Endpoint.authVerify(), {token:authToken}, responseCB, errorCB);
    }

    async rolePermission(authToken, role, responseCB, errorCB)
    {
        this.get(MAS_Endpoint.rolePermissions(role), { [Header_X_API_KEY]: authToken }, responseCB, errorCB);
    }

    async post(path, bodyObj, responseCB, errorCB) {

        this.request({
            url     : `${this.mBaseUrl}/${path}`,
            method  : 'POST',
            headers : { "Content-Type": "application/json" },
            body    : bodyObj
        }, responseCB, errorCB);
    }

    async get(path, headers, responseCB, errorCB) {

        this.request({
            url     : `${this.mBaseUrl}/${path}`,
            headers : headers,
        }, responseCB, errorCB);
    }

    async request(requestConfig, reponseCB, errorCB)
    {
        try {
            const response = await fetch(requestConfig.url, {
              method: requestConfig.method ? requestConfig.method : "GET",
              headers: requestConfig.headers ? requestConfig.headers : {},
              body: requestConfig.body ? JSON.stringify(requestConfig.body) : null,
            });

            if (!response.ok) {
                const text = await response.text();
                throw Error(text);
            }
            const data = await response.json();
            reponseCB(data);
        } catch (err) {
            console.log(`ServiceMAS : request failed:${JSON.stringify(requestConfig)}, reason:${err.message}`);
            errorCB(err);
        }
    }
}

export default function ServiceMAS_Module(apiDomain)
{
    const mas = new ServiceMAS(apiDomain);
    return {
        authVerify     : (authToken, responseCB, errorCB)       => { mas.authVerify(authToken, responseCB, errorCB) },
        rolePermission : (authToken, role, responseCB, errorCB) => { mas.rolePermission(authToken, role, responseCB, errorCB); }
    };
}