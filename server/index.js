// 导入
const Websocket = require('ws')

// 创建一个server，Websocket中有一个Server的属性,注意：是new了一个Websocket的Server，里面给一个端口
const server = new Websocket.Server({ port: 8000 })

// 监听
server.on('connection', handleConnection)

// 事件处理函数,里面带有wx的实例,也就是WebSocket的实例
function handleConnection(wx) {
  console.log('---server is connection---')

  // 监听关闭事件
  wx.on('close', handleClose)
  // 监听错误事件
  wx.on('error', handleError)
  // 监听来消息的时候
  wx.on('message', handleMessage)
  // 监听关闭连接 
  function handleClose() {
    this.send(JSON.stringify({
      mode: 'MESSAGE',
      msg: '---server is closed---'
    }))
  }
  // 监听到错误
  function handleError(e) {
    console.log('---server is Error---', e)
  }
  // 接收到消息
  function handleMessage(data) {
    const { mode, msg } = JSON.parse(data)
    let obj = {
      mode,
      msg: mode === 'MESSAGE' ? `服务器返回的消息--${msg}` : '心跳连接返回的消息'
    }
    switch (mode) {
      case 'MESSAGE':
        this.send(JSON.stringify(obj))
        break;
      case 'HEART_BEAT':
        this.send(JSON.stringify(obj))
        break;
      default:
        break;

    }
  }
}