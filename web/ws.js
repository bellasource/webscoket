const WS_MODE = {
  MESSAGE: 'MESSAGE',
  HEART_BEAT: 'HEART_BEAT'
}
const configDefault = {
  heartTime: 4000,
  reConnect: true, // 开启重连机制
  reConnectTime: 3, // 重连次数
  success: () => {},
  error: () => {},
}

// 继承WebSocket
// 当new Ws的时候，就相当于new一个WebSocket的对象
class Ws extends WebSocket {
  constructor(url, config) {
    // 将url交给super，则是WebSocket的constructor
    super(url)
    
    // 当实例化重连的时候，还得需要url,名字不能起this.url,因为WebSocket实例中有url
    this.wsUrl = url
    // 心跳连接定时器
    this.heartBeatTimer = null
    // 重连定时器
    this.reconnectingTimer = null
    this.initParams(config)
    this.initEvent()
  }
  initParams(config) {
    this.config = Object.assign({...configDefault}, config)
    console.log(this.config, '这是配置参数数据')
  }
  initEvent() {
    this.addEventListener('open', this.handleOpen, false)
    this.addEventListener('close', this.handleClose, false)
    this.addEventListener('error', this.handleError, false)
    this.addEventListener('message', this.handleMessage, false)
  }
  handleOpen() {
    console.log('--- 连接成功---')
    // 连接时，开启心跳机制,检查是否断开，断开需要重连
    this.startHeartBeat()
  }

  handleClose() {
    console.log('--- 连接关闭---')
    // 清除心跳
    if (this.heartBeatTimer) {
      clearInterval(this.heartBeatTimer)
      this.heartBeatTimer = null
    }
    // 清除重连
    if (this.reconnectingTimer) {
      clearTimeout(this.reconnectingTimer)
      this.reconnectingTimer = null
    }
    // 判断是否需要重连
    this.shouldConnect()

  }

  handleError(e) {
    this.shouldConnect()
  }

  handleMessage(data) {
    const { mode, msg } = JSON.parse(data.data)
    switch (mode) {
      case WS_MODE.MESSAGE:
        console.log('--- MESSAGE ---', msg)
        this.config.success(msg)
        break;
      // 此时接收到消息了，客户端和服务端肯定是连接状态，
      case WS_MODE.HEART_BEAT:
        console.log('--- 心跳连接的消息 ---')
        break;
      default:
        break;
    }
  }

  // 计时器 间隔一定时间，发一次消息，用来判断是否连接已断开
  startHeartBeat() {
    this.heartBeatTimer = setInterval(() => {
      // 如果关闭时也发送会报错
      if (this.readyState === 1) {
        this.sendMsg({
          mode: WS_MODE.HEART_BEAT,
          msg: 'HEART_BEAT'
        })
      } else {
        clearInterval(this.heartBeatTimer)
        this.heartBeatTimer = null
      }
    }, this.config.heartTime)
  }

  // 判断是否断线重连
  shouldConnect() {
    if (this.config.reConnect && this.config.reConnectTime > 0) {
      this.config.reConnectTime--
      this.reconnectingTimer = setTimeout(() => {
        clearTimeout(this.reconnectingTimer)
        this.reconnectingTimer = null
        clearInterval(this.heartBeatTimer)
        this.heartBeatTimer = null
        this.config.error(this)
      }, 3000)
    } else {
      clearTimeout(this.reconnectingTimer)
    }
  }

  // 发送信息，用字符串
  sendMsg(data) {
    // readyState 0 正在连接中 1 已连接 2 连接正在关闭 3 连接已关闭
    this.readyState === 1 && this.send(JSON.stringify(data))
  }

  static create(url, config) {
    return new Ws(url, config)
  }

}