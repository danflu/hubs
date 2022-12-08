import IFrameInterface from "../../../../manoweb/webpack/src/metaverse/iframe-interface";
import ServiceAPI_Module from "./service-apis";
import configs from "../../utils/configs";

const App = window.AppInterface;

class UserPermissions
{
    constructor()
    {
        this.mSendChat    = false;
        this.mEmojiReaction = false;
        this.mUsePen      = false;
        this.mShareScreen = false;
        this.mShareCamera = false;
        this.mAddObjects  = false;
        this.mAddScene    = false;
        this.mAddCamera   = false;
        this.mAddAvatar   = false;
        this.mAddGIF      = false;
    }

    get()
    {
        return {
            sendChat      : this.mSendChat,
            emojiReaction : this.mEmojiReaction,
            usePen        : this.mUsePen,
            shareScreen   : this.mShareScreen,
            shareCamera   : this.mShareCamera,
            addObjects    : this.mAddObjects,
            addScene      : this.mAddScene,
            addCamera     : this.mAddCamera,
            addAvatar     : this.mAddAvatar,
            addGIF        : this.mAddGIF
        };
    }

    enableSendChat(flag)
    {
        this.mSendChat = flag;
        console.log(`UserPermissions : enableSendChat : ${flag}`);
    }

    enableEmojiReaction(flag)
    {
        this.mEmojiReaction = flag;
        console.log(`UserPermissions : enableEmojiReaction : ${flag}`);
    }

    enableUsePen(flag)
    {
        this.mUsePen = flag;
        console.log(`UserPermissions : enableUsePen : ${flag}`);
    }

    enableShareScreen(flag)
    {
        this.mShareScreen = flag;
        console.log(`UserPermissions : enableShareScreen : ${flag}`);
    }

    enableShareCamera(flag)
    {
        this.mShareCamera = flag;
        console.log(`UserPermissions : enableShareCamera : ${flag}`);
    }

    enableAddObjects(flag)
    {
        this.mAddObjects = flag;
        console.log(`UserPermissions : enableAddObjects : ${flag}`);
    }

    enableAddScene(flag)
    {
        this.mAddScene = flag;
        console.log(`UserPermissions : enableAddScene : ${flag}`);
    }

    enableAddCamera(flag)
    {
        this.mAddCamera = flag;
        console.log(`UserPermissions : enableAddCamera : ${flag}`);
    }

    enableAddAvatar(flag)
    {
        this.mAddAvatar = flag;
        console.log(`UserPermissions : enableAddAvatar : ${flag}`);
    }

    enableAddGIF(flag)
    {
        this.mAddGIF = flag;
        console.log(`UserPermissions : enableAddGIF : ${flag}`);
    }
}

const version = "0.0.0.5";

const IRMAuthTokenKey = "irmAuthToken";
const IRMApiDomainKey = "irmApiDomain";
const IRMAppSchemeKey = "irmAppScheme";

export default class IRMCtrl {

    constructor()
    {
        this.mLeaveReason = {
            UserLeft  : 0,
            AuthError : 1,
            PermissionError : 2,
            InvalidParams : 3,
            InvalidApiDomain : 4
        };

        this.mURL = new URL(window.location.href);
        this.mHubId = this.mURL.pathname.split('/')[1];
        if (this.mHubId === "hub.html") {
            this.mHubId = this.mURL.searchParams.get("hub_id");
        }
        this.mParentId = this.qsVal("parent_id");
        this.mPingTimer = null;

        this.mNick = null;
        this.mServiceAPI = null;
        this.mInitCalled = false;

        this.mPermissions = new UserPermissions();

        const appname   = this.qsVal("app_name");
        const apiDomain = appname ? `https://${appname}-api.ip.tv` : this.checkVal(this.qsVal("api_domain"), IRMApiDomainKey);

        const authToken = this.checkVal(this.qsVal("auth_token"), IRMAuthTokenKey);

        this.mAppScheme = this.checkVal(this.qsVal("app_scheme"), IRMAppSchemeKey);

        if (authToken && apiDomain)
        {
            const apiDomainParts = apiDomain.split(".");
            if (apiDomainParts.length != 3 || apiDomainParts[1] != "ip" || apiDomainParts[2] != "tv") {
                console.log(`IRMCtrl : invalid api domain:${apiDomain}`);
                this.leave(this.mLeaveReason.InvalidApiDomain);
            }
            this.mServiceAPI = ServiceAPI_Module(apiDomain, authToken);
        }

        console.log(`IRMCtrl : Loading client version ${version} [appname:${appname}, apiDomain:${apiDomain}, authToken:${authToken}, appScheme:${this.mAppScheme}, hubId:${this.mHubId}, parentId:${this.mParentId}]`);

        if (configs.inIframe())
        {
            this.mIFrameInterface = new IFrameInterface(() => {
                // onCloseCB
                this.leave();
            });
        }
    }

    checkVal(val, key) {
        if (val) {
            localStorage.setItem(key, val);
        } else {
            val = localStorage.getItem(key);
            console.log(`IRMCtrl : checkVal : Not set, checking stored key ${key} value:(${val})`);
        }
        return val;
    }

    initCalled() {
        return this.mInitCalled;
    }

    startPing(nick) {
        this.stopPing();

        if (nick && this.mHubId && this.mParentId)
        {
            const intervalMs = 30000;
            this.mPingTimer = setInterval( async() => {
                console.log(`IRMCtrl : startPing : pinging (nick:${nick}, hubId:${this.mHubId}, parentId:${this.mParentId})`);
                await this.mServiceAPI.metaverseLiveProbe(nick, this.mHubId, this.mParentId);
            }, intervalMs);
        }
        else
        {
            console.log(`IRMCtrl : startPing : ignoring...`);
        }
    }

    stopPing() {
        if (this.mPingTimer) {
            clearInterval(this.mPingTimer);
            this.mPingTimer = null;
        }
    }

    async init(hubChannel, updateStateCB)
    {
        const authEnabled = configs.isIRMAuthModeEnabled();

        this.mInitCalled = true;
        this.mUpdateStateCB = updateStateCB;

        console.log(`IRMCtrl : init : auth enabled:${authEnabled}`);

        if (this.mServiceAPI)
        {
            let result = await this.mServiceAPI.masAuthVerify();
            if (result)
            {
                console.log(`IRMCtrl : init : auth verify success:${JSON.stringify(result.body)}`);
                const {nick, role} = result.body;

                result = await this.mServiceAPI.masPermissionRole(role);
                if (result)
                {
                    console.log(`IRMCtrl : init : got role permissions:${JSON.stringify(result.body)}`);
                    this.setUser(result.body, nick);
                    this.startPing(nick);
                }
                else
                {
                    this.leave(this.mLeaveReason.PermissionError);
                }
            }
            else
            {
                this.leave(this.mLeaveReason.AuthError);
            }
        }
        else if (configs.isAdmin())
        {
            console.log("IRMCtrl : init : user is admin");
            this.setUser();
        }
        else
        {
            console.log(`IRMCtrl : init : waiting permissions update...`);

            hubChannel.addEventListener("permissions_updated", () => {

                console.log(`IRMCtrl : init : received permissions update...`);

                if (configs.isAdmin() || !authEnabled)
                {
                    this.setUser();
                }
                else
                {
                    console.log(`IRMCtrl : init : no admin rights (auth token required) leaving...`);

                    this.leave(this.mLeaveReason.InvalidParams);
                }
            });
        }
    }

    setUser(rolePermissions = null, nick = null)
    {
        console.log("IRMCtrl : setUser");

        if (rolePermissions)
        {
            this.handleRolePermissionResponse(rolePermissions);
        }
        else
        {
            this.setAllPermissions();
        }

        if (!nick)
        {
            nick = this.qsVal("nick");

            if (!nick)
            {
                const baseNick = configs.isAdmin() ? "admin" : "guest";

                nick = `${baseNick}${Date.now()}`;
            }
        }

        this.mNick = nick;

        this.updateState();
    }

    setAllPermissions()
    {
        this.setPermissions(true, true, true, true, true, true);
    }

    setPermissions(sendChat, emojiReaction, usePen, shareScreen, shareCamera, addObjects)
    {
        this.mPermissions.enableSendChat(sendChat);
        this.mPermissions.enableEmojiReaction(emojiReaction);
        this.mPermissions.enableUsePen(usePen);
        this.mPermissions.enableShareScreen(shareScreen);
        this.mPermissions.enableShareCamera(shareCamera);
        this.mPermissions.enableAddObjects(addObjects);     
    }

    handleRolePermissionResponse(response)
    {
        // "mas_metaverse_room_module":true,
        // "mas_metaverse_room_create":true,
        // "mas_metaverse_room_edit":true,
        // "mas_metaverse_room_delete":true,
        // "mas_metaverse_room_start":true,
        // "mas_metaverse_room_chat_enable":true,
        // "mas_metaverse_room_emoji_enable":true,
        // "mas_metaverse_room_pen_enable":true,
        // "mas_metaverse_room_share_screen":true,
        // "mas_metaverse_room_share_camera":true,
        // "mas_metaverse_room_add_objects":true,

        const isMakerScene = () => {
            // these urls are predefined 'maker scenes' that allow users to edit then in order to 'showcase' capabilites.
            const href = window.location.href;
            const url  = new URL(href);
            let   ret  = false;
            switch(url.hostname)
            {
                case "metaverse.ip.tv":
                {
                    if (url.pathname === "/nDLzQQN" ||
                        url.pathname === "/j9VbCEJ" ||
                        url.pathname === "/rDtnBg2" ||
                        url.pathname === "/JWXDmoi" ||
                        url.pathname === "/iFuPijg" ||
                        url.pathname === "/5Zf4Rty" ||
                        url.pathname === "/acFLY9N" ||
                        url.pathname === "/x7EJ8dE" ||
                        url.pathname === "/6GksLy5" ||
                        url.pathname === "/tmg7t6Y" ||
                        url.pathname === "/dzAB8Xa")
                        {
                            ret = true;
                        }
                }

                case "metatest.ip.tv":
                    if (url.pathname === "/vGJYqWS")
                    {
                        ret = true;
                    }
                    break;
            }

            if (ret)
            {
                console.log(`IRMCtrl : handleRolePermissionResponse : ${href} is a predefined maker scene`);
            }

            return ret;
        }

        const val = (key) => {const v = response[key]; return v ? v : false;}

        const makerScene    = isMakerScene();

        //const addScene      = val("mas_metaverse_room_create");
        const sendChat      = makerScene || val("mas_metaverse_room_chat_enable");
        const emojiReaction = makerScene || val("mas_metaverse_room_emoji_enable");
        const usePen        = makerScene || val("mas_metaverse_room_pen_enable");
        const shareScreen   = makerScene || val("mas_metaverse_room_share_screen");
        const shareCamera   = makerScene || val("mas_metaverse_room_share_camera");
        const addObjects    = makerScene || val("mas_metaverse_room_add_objects");

        this.setPermissions(sendChat, emojiReaction, usePen, shareScreen, shareCamera, addObjects);
    }

    leave(reason = 0)
    {
        console.log(`IRMCtrl : leave : reason:${reason}`);

        this.stopPing();

        const initialHRef = "/";

        let href = initialHRef;

        if (this.mIFrameInterface)
        {
            this.mIFrameInterface.notifyClose(reason);
        }
        else if (App)
        {
            App.close(reason);
        }
        else if (this.mAppScheme)
        {
            // security measure to force redirect anyway...
            setTimeout( () => {
                console.log('IRMCtrl : leave : leaving...');
                this.setHref(initialHRef);
            }, 1000);
            href = (`${this.mAppScheme}://closeMetaverse?reason=${reason}`);
        }
        this.setHref(href);
    }

    updateState()
    {
        this.mUpdateStateCB(this.data());
    }

    data()
    {
        return {nick:this.mNick, allow:this.mPermissions.get()};
    }

    qsVal(key, defaultVal = null)
    {
        const v = this.mURL.searchParams.get(key);
        return v ? v : defaultVal;
    }

    setHref(href)
    {
        console.log(`IRMCtrl : setHref : ${href}`);
        window.location.href = href;
    }
}