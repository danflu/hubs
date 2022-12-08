import Http from "../../../../manoweb/webpack/src/common/http-requester.mjs";
class ServiceAPI
{
    constructor(apiDomain, authToken) {
        this.mApiDomain = apiDomain;
        this.mAuthToken = authToken;
        this.mPath = {
            masAuthVerify      : ()   => this.url("mas/auth/verify"),
            masPermissionRole  : role => this.url(`mas/permission/${role}`),
            metaverseLiveProbe : ()   => this.url("metaverse/live/probe")
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
            console.log(`ServiceAPI : masPermissionRole : role:${role}, error:${e.message})`);
        }
    }

    async metaverseLiveProbe(nick, hubId, parentId)
    {
        try {
            const req = Http.createPostReq(this.mPath.metaverseLiveProbe())
                .setHeaderContentTypeJson()
                .setHeaderXApiKey(this.mAuthToken)
                .setBodyJsonObj({"nick":nick, "hub_id":hubId, "parent_id":parentId});

            const result = Http.request(req, Http.flags().PARSE_JSON);
            return Http.checkResult(result);
        } catch (e) {
            console.log(`ServiceAPI : metaverseLiveProbe : nick:${nick}, hubId:${hubId}, parentId:${parent}, error:${e.message})`);
        }
    }
}

export default function ServiceAPI_Module(apiDomain, authToken)
{
    const s = new ServiceAPI(apiDomain, authToken);
    return {
        masAuthVerify      : async ()     => { return s.masAuthVerify() },
        masPermissionRole  : async (role) => { return s.masPermissionRole(role); },
        metaverseLiveProbe : async (nick, hubId, parentId) => { return s.metaverseLiveProbe(nick, hubId, parentId); }
    };
}