const WS_MODE = {
  MESSAGE:'MESSAGE',
  HEART_BEAT:'HEART_BEAT'
}


// 继承WebSocket
// 当new Ws的时候，就相当于new一个WebSocket的对象
class Ws extends WebSocket{
  // 当new的时候填写的url，相当于在这加一个url,相当于调constructor
  // url是 ws://localhost:8000
  constructor(url,wsReConnect){
      // 将url交给super，则是WebSocket的constructor
      super(url)
      // 当实例化重连的时候，还得需要url,名字不能起this.url,因为WebSocket实例中有url
      this.wsUrl = url
      this.heartBeatTimer = null
      this.reconnectingTimer = null
      this.wsReConnect = wsReConnect
      this.init()
  }
  // init 相当于一个开关
      init(){
          this.bindEvent()
      }
  // 绑定函数，如open、close、error、message
      bindEvent(){
          // this:Ws的实例，监听open、close、error、message
          this.addEventListener('open',this.handleOpen,false)
          this.addEventListener('close',this.handleClose,false)
          this.addEventListener('error',this.handleError,false)
          this.addEventListener('message',this.handleMessage,false)
      }
      handleOpen(){
          console.log('--- Client is connected---')
          // 连接时，开启心跳机制,检查是否断开，断开需要重连
          // 在startHeartBeat肯定要做间隙interval，则在reconnect中需要做延时进行重连，则需要两个计时器
          this.startHeartBeat()
      }

      handleClose(){
          console.log('--- Client is closed---')
          // 关闭时，如果客户端还在，需要重连，页面关闭就彻底关闭。
          if(this.heartBeatTimer){
          // 关闭时，清除this.heartBeatTimer定时器
              clearInterval(this.heartBeatTimer)
              this.heartBeatTimer = null
          }

          if(this.reconnectingTimer){
              clearTimeout(this.reconnectingTimer)
              this.reconnectingTimer = null
          }
          this.reconnect()

      }

      handleError(e){
          console.log('--- Client is error---',e)
          this.reconnect()

      }

      handleMessage(data){
          // console.log('--- Client is msg---')
          const { mode, msg} = this.receiveMsg(data)

          switch(mode){
              
              case WS_MODE.MESSAGE:
                  console.log('--- MESSAGE ---',msg)
                  break;
              // 此时接收到消息了，客户端和服务端肯定是连接状态，
              case WS_MODE.HEART_BEAT:
                  console.log('--- HEART_BEAT ---',msg)
                  break;
              default:
                  break;
          }

      }
      // 计时器
      startHeartBeat(){
          this.heartBeatTimer = setInterval(()=>{
              // 告诉服务端，来了一个HEART_BEAT的消息,this.connentStatue为真时，才发送消息，
              // 如果关闭时也发送会报错

              if(this.readyState === 1){
                  this.sendMsg({
                      mode:WS_MODE.HEART_BEAT,
                      msg:'HEART_BEAT'
                  })
              }else{
                  clearInterval(this.heartBeatTimer)
                  this.heartBeatTimer = null
              }
              // 模拟关闭,导致重连reconnect
              this.waitForResponse()
              
          },4000)
      }

      // 延迟重连
      reconnect(){
          this.reconnectingTimer = setTimeout(()=>{
              this.wsReConnect()
          },3000)
      }

      waitForResponse () {
          setTimeout(()=>{
                  this.close()
          },2000)
      }

      // 将data换成js对象
      receiveMsg({ data }){
          return JSON.parse(data)
      }

      // 发送信息，用字符串
      sendMsg(data){
          this.readyState === 1 && this.send(JSON.stringify(data))
      }

      static create(url,wsReConnect){
          return new Ws(url,wsReConnect)
      }

  }