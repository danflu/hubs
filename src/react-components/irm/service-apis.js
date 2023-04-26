import Http from "../../../../web-util/common/http-requester.mjs";
class ServiceAPI
{
    constructor(apiDomain, authToken) {
        this.mApiDomain = apiDomain;
        this.mAuthToken = authToken;
        this.mPath = {
            masAuthVerify      : ()     => this.url("mas/auth/verify"),
            masPermissionRole  : role   => this.url(`mas/permission/${role}`),
            roomMetaverseLiveProbe : () => this.url("room/metaverse/live/probe")
        };
    }

    url(path) { return `${this.mApiDomain}/${path}`; }

    async masAuthVerify()
    {
        try {
            const req = Http.createPostReq(this.mPath.masAuthVerify())
                .setHeaderContentTypeJson()
                .setBodyJsonObj({"token":this.mAuthToken});

            const result = await Http.request(req, Http.flags().PARSE_JSON);
            return Http.checkResult(result);
        } catch (e) {
            console.log(`ServiceAPI : masAuthVerify : token:${this.mAuthToken}, error:${e.message})`);
        }
    }

    async masPermissionRole(role)
    {
        try {
            const req = Http.createGetReq(this.mPath.masPermissionRole(role))
                .setHeaderXApiKey(this.mAuthToken);

            const result = await Http.request(req, Http.flags().PARSE_JSON);
            return Http.checkResult(result);
        } catch (e) {
            console.log(`ServiceAPI : masPermissionRole : token:${this.mAuthToken}, role:${role}, error:${e.message})`);
        }
    }

    async roomMetaverseLiveProbe(hubId, parentId)
    {
        try {
            const req = Http.createPostReq(this.mPath.roomMetaverseLiveProbe())
                .setHeaderContentTypeJson()
                .setHeaderXApiKey(this.mAuthToken)
                .setBodyJsonObj({"hub_id":hubId, "parent_id":parentId});

            const result = Http.request(req, Http.flags().PARSE_JSON);
            return Http.checkResult(result);
        } catch (e) {
            console.log(`ServiceAPI : roomMetaverseLiveProbe : token:${this.mAuthToken}, hubId:${hubId}, parentId:${parentId}, error:${e.message})`);
        }
    }
}

export default function ServiceAPI_Module(apiDomain, authToken)
{
    const s = new ServiceAPI(apiDomain, authToken);
    return {
        masAuthVerify      : async ()     => { return s.masAuthVerify() },
        masPermissionRole  : async (role) => { return s.masPermissionRole(role); },
        roomMetaverseLiveProbe : async (hubId, parentId) => { return s.roomMetaverseLiveProbe(hubId, parentId); }
    };
}