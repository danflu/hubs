import IFrameInterface from "../../../../web-util/common/iframe-interface";
import ServiceAPI_Module from "./service-apis";
import configs from "../../utils/configs";

//import {Buffer} from 'buffer';
//const App = window.AppInterface;

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

const version = "0.1.22";

const QSParamAppName    = "app_name";
const QSParamApiDomain  = "api_domain";
const QSParamAuthToken  = "auth_token";
const QSParamAppScheme  = "app_scheme";
const QSParamParentId   = "parent_id";
const QSParamNick       = "nick";
const QSParamFlags      = "flags";

const QSFlagNotifyLinks = 0x01;

export default class IRMCtrl {

    constructor()
    {
        console.log(`IRMCtrl : ${window.location.href}`);

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
        this.mParentId = this.qsVal(QSParamParentId);
        this.mPingTimer = null;

        this.mServiceAPI = null;
        this.mInitCalled = false;

        this.mPermissions = new UserPermissions();

        // maps query string key to local storage key
        this.mKV = {};
        this.mKV[QSParamAppName]   = "irmAppName";
        this.mKV[QSParamApiDomain] = "irmApiDomain";
        this.mKV[QSParamAuthToken] = "irmAuthToken";
        this.mKV[QSParamAppScheme] = "irmAppScheme";
        this.mKV[QSParamNick]      = "irmNick";
        this.mKV[QSParamFlags]     = "irmFlags";

        this.mFlags = 0;
        this.mNick = this.checkVal(QSParamNick);
        let flags = this.checkVal(QSParamFlags);
        if (flags)
        {
            flags = parseInt(flags);
            if (Number.isInteger(flags) && flags > 0) 
                this.mFlags = flags;
        }

        let apiDomain = null;
        const appname = this.qsVal(QSParamAppName);
        if (appname)
        {
            apiDomain = this.appNameToApiDomain(appname);
            localStorage.setItem(this.mKV[QSParamAppName], appname);
            localStorage.removeItem(this.mKV[QSParamApiDomain]);
        }
        else
        {
            apiDomain = this.qsVal(QSParamApiDomain);
            if (apiDomain)
            {
                localStorage.setItem(this.mKV[QSParamApiDomain], apiDomain);
                localStorage.removeItem(this.mKV[QSParamAppName]);
            }
            else
            {
                const appname = this.checkVal(QSParamAppName);
                if (appname) { apiDomain = this.appNameToApiDomain(appname); }
                else
                {
                    apiDomain = this.checkVal(QSParamApiDomain);
                }
            }
        }

        const authToken = this.checkVal(QSParamAuthToken);

        this.mAppScheme = this.checkVal(QSParamAppScheme);

        if (authToken && apiDomain)
        {
            const apiDomainParts = apiDomain.split(".");
            if (apiDomainParts.length != 3 || apiDomainParts[1] != "ip" || apiDomainParts[2] != "tv") {
                console.log(`IRMCtrl : invalid api domain:${apiDomain}`);
                this.leave(this.mLeaveReason.InvalidApiDomain);
            }
            this.mServiceAPI = ServiceAPI_Module(apiDomain, authToken);
        }

        console.log(`IRMCtrl : Loading client version ${version} [appname:${appname}, apiDomain:${apiDomain}, authToken:${authToken}, appScheme:${this.mAppScheme}, hubId:${this.mHubId}, parentId:${this.mParentId}], flags:${this.mFlags}`);

        if (configs.inIframe())
        {
            this.mIFrameInterface = new IFrameInterface(() => {
                // onCloseCB
                this.leave();
            });
            this.clickEvt = () => {
                this.mIFrameInterface.notifyUserClick();
            };
            document.addEventListener('click', this.clickEvt);
        }
    }

    appNameToApiDomain(appname) {
        return `https://${appname}-api.ip.tv`;
    }

    checkVal(qsKey) {
        const lsKey = this.mKV[qsKey];
        if (!lsKey) {
            console.log(`IRMCtrl : checkVal : invalid qsKey:${qsKey}`);
            return;
        }

        let val = this.qsVal(qsKey);

        if (val) {
            localStorage.setItem(lsKey, val);
        } else {
            val = localStorage.getItem(lsKey);
            console.log(`IRMCtrl : checkVal : key:${qsKey} not in query string, checking localstorage ${lsKey} : (${val})`);
        }
        return val;
    }

    initCalled() {
        return this.mInitCalled;
    }

    startPing() {
        this.stopPing();

        if (this.mHubId && this.mParentId)
        {
            const intervalMs = 30000;
            this.mPingTimer = setInterval( async() => {
                console.log(`IRMCtrl : startPing : pinging (nick:${this.mNick}, hubId:${this.mHubId}, parentId:${this.mParentId})`);
                await this.mServiceAPI.roomMetaverseLiveProbe(this.mHubId, this.mParentId);
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
                    this.startPing();
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
        console.log(`IRMCtrl : setUser, current nick:${this.mNick}`);

        if (rolePermissions)
        {
            this.handleRolePermissionResponse(rolePermissions);
        }
        else
        {
            this.setAllPermissions();
        }

        if (!this.mNick)
        {
            if (!nick)
            {
                const baseNick = configs.isAdmin() ? "admin" : "guest";
                nick = `${baseNick}${Date.now()}`;
            }

            this.mNick = nick;
        }

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
                        url.pathname === "/dzAB8Xa" ||
                        url.pathname === "/NLUUnNw" ||
                        url.pathname === "/iyCM2C9")
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
        //else if (App)
        //{
        //    App.close(reason);
        //}
        else if (this.mAppScheme)
        {
            // security measure to force redirect anyway...
            setTimeout( () => {
                console.log('IRMCtrl : leave : leaving...');
                this.setHref(initialHRef);
            }, 1000);
            href = `${this.mAppScheme}://closeMetaverse?reason=${reason}`;
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

    handleLink(src)
    {
        let ret = false;

        if ((this.mFlags & QSFlagNotifyLinks) === QSFlagNotifyLinks)
        {
            if (this.mIFrameInterface)
            {
                this.mIFrameInterface.notifyOpenLink(src);
                ret = true;
            }
            else if (this.mAppScheme)
            {
                const type = 0;
                const href = `${this.mAppScheme}://openLink?type=${type}&url=${encodeURIComponent(src)}`;
                this.setHref(href);
                ret = true;
            }
        }
        return ret;
    }

    /*
    handleLink(src)
    {
        const url = new URL(src);
        if (url.hostname === "iptv.smileandlearn.com")
        {
            const process = (str) => {
                if (!str) return null;
                // transform to base64 and replace some chars
                const b64 = Buffer.from(str).toString('base64');
                //to decode:
                //Buffer.from(base64data, 'base64').toString('ascii')

                // “+” is replaced by “-“.
                // “/” is replaced by “_”.
                // “=” is replaced by “,”.
                const chars = {
                    '+': '-',
                    '/': '_',
                    '=': ','
                };
                const res = b64.replace(/[+\/=]/g, m => chars[m]);
                return res;
            }
            //API parameters:
            const lt1   = "bAQOXdmdLEqDAHFatp3QrJakN0T7EUXrAPG/2JLYOLGM7IEwL+s5CTFe8OspCThfGOsPHoorxie8NJAm0k095A==";
            const ap1k  = process("uaC04ssGeZ3wQ4FKG7PzsFydIsfvHL92");
            const lms   = process("api");
            const w4ddr = process("https://gc-sigma.ip.tv:8444/webhook");

            const hasQS = url.search.length > 0 ? true : false;
            if (hasQS) src += "&";
            else       src += "?";
            src += `lt1=${lt1}&ap1k=${ap1k}&lms=${lms}&w4ddr=${w4ddr}`;

            //Custom parameters: set by the caller (the client) to introduce custom fields that are delivered to the callback.
            //The client can include custom parameters, that will be sent “as is” to the callback URL.
            //All these parameters must be encoded in Base64Url format.
            const authToken = process(this.checkVal(QSParamAuthToken));
            if (authToken) src += `&authToken=${authToken}`;

            console.log(`IRMCtrl : handleLink : opening:${src}`);
            window.open(src);
            return true;
        }
        return false;
    }*/
}