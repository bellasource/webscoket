import Rwebsocket from "reconnecting-websocket";
class Wsocket {
  clientHost = null;
  clientSender = null;
  timer = null;
  typeIndex = 0;
  receiveType = new Map();
  isOpen = false;
  // messageList = [];
  constructor() {
    this.instance = null;
    // setInterval(() => {
    //   this.isOpen &&
    //     this.messageList.length &&
    //     this.sendMessageHandler(this.messageList.shift());
    // }, 1000);
  }
  // 连接websocket
  connectWebsocket(clientHost, clientSender) {
    return new Promise((resolve, reject) => {
      this.instance = new Rwebsocket("wss://ecydldks.game.jingyougz.com:9948");
      this.instance.binaryType = "arraybuffer";
      this.clientHost = clientHost; // 解码
      this.clientSender = clientSender; //编码发送时编码

      this.instance.onopen = (evt) => {
        console.log("连接成功", evt);
        this.isOpen = true;
        // TODO: 暂时屏蔽心跳
        // this.heartBeat();
        resolve(evt);
      };
      this.instance.onclose = (evt) => {
        console.warn("websocket已关闭", evt);
        this.isOpen = false;
        clearInterval(this.timer);
      };
      this.instance.onmessage = (evt) => {
        this.onMessageHandler(evt);
      };
      this.instance.onerror = (error) => {
        console.error("websocket连接失败", error);
        this.isOpen = false;
        clearInterval(this.timer);
        reject(error);
      };
    });
  }
  // 心跳
  heartBeat() {
    // 每隔30秒发送一次心跳
    this.timer = setInterval(() => {
      this.sendMessageHandler({
        type: "System_HeartBeat",
        dataObj: { clientTime: new Date().getTime() },
      });
    }, 30000);
  }
  // 注册监听事件
  registerHandler(cb) {
    this.handler = cb;
  }
  //移除注册事件
  removeHandler() {
    this.handler = () => {};
  }
  // 发送消息(要不data整一个对象的了。)
  /**
   *
   * @param {*} value :{ type: xxxx, dataObj:{}}
   * @param {*} type:是个字符串在sproto里定义好，
   * @param {*} dataObj:是个对象，里面的数据要和sproto里定义好的一样可以看心跳发送的方式。
   */
  sendMessageHandler(value) {
    // if (!this.isOpen) {
    //   console.log("没有连接成功，先存起来", value);
    //   this.messageList.push(value);
    //   return;
    // }
    const { type, dataObj } = value;
    console.log("发送的消息", "type:", type, "dataObj:", dataObj);
    const time = setInterval(() => {
      if (this.instance && this.isOpen) {
        clearInterval(time);
        this.instance.send(
          new Uint8Array(this.clientSender(type, dataObj, ++this.typeIndex))
        );
        type !== "System_HeartBeat" &&
          this.receiveType.set(this.typeIndex, type);
      }
    });
  }
  // 消息事件监听
  onMessageHandler(message) {
    try {
      const data = this.clientHost.dispatch(new Uint8Array(message.data));
      data.type = this.receiveType.get(data.session) ?? data.pname;
      console.log("接收的消息:", data);
      this.handler?.call(this, data);
    } catch (err) {
      this.handler?.call(
        this,
        this.clientHost.dispatch(new Uint8Array(message.data))
      );
    }
  }
  // 断开连接
  close() {
    console.log("和服务器断开连接的触发");
    this.instance?.close();
  }
}
export default new Wsocket();