const {app,BrowserWindow,ipcMain,Menu,globalShortcut, shell,dialog} = require('electron')
const path = require('path')
const os = require('os')
const fs = require('fs')
const Store = require('./Store')

const preferences = new Store({configName: 'user-preferences',defaults:{destination:path.join(os.homedir())}})

let destination = preferences.get('destination')
let isDev = process.env.NODE_ENV !=undefined && process.env.NODE_ENV==='development'?true:false

//isDev = true

function createPreferenceWindow(){
    const preferenceWindow = new BrowserWindow({
        width:isDev?950:500,
        resizable:isDev?true:false,
        height:150,
        backgroundColor:"#234",
        show:false,
        icon:path.join(__dirname,"assets","icons","icon.png"),
        webPreferences:{
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true,
        },
    })
    preferenceWindow.loadFile('./src/preferences/index.html')

    preferenceWindow.once("ready-to-show",function(){
        preferenceWindow.show(true)
        if(isDev){
            preferenceWindow.webContents.openDevTools()
        }
        preferenceWindow.webContents.send("dest-path-update",destination)
    })
    
}


function createWindow(){
    const win = new BrowserWindow({
        width:isDev?950:500,
        resizable:isDev?true:false,
        height:300,
        backgroundColor:"#234",
        show:false,
        icon:path.join(__dirname,"assets","icons","icon.png"),
        webPreferences:{
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true,
        },
    })

    win.loadFile("./src/mainWindow/index.html")
    if(isDev){
        win.webContents.openDevTools()
    }

    win.once("ready-to-show",function(){
        win.show(true)
        //win.webContents.send()
    }) 
    const menuTemplate =[
        {
            label:app.name,
            submenu:[
            {label:"Preferences",click:()=>{createPreferenceWindow()}},
            {label:"Open destination folder",click:()=>{shell.openPath(destination)}}
         ]
        },
        
        {
            label:'File',
            submenu:[
                {role:"quit"}
            ]

        }
    ]
    const menu = Menu.buildFromTemplate(menuTemplate)
    Menu.setApplicationMenu(menu)
}
app.whenReady().then(()=>{
    createWindow()
})
app.on('window-all-closed',function(){
    app.quit()
})
app.on('activate',()=>{
    if(BrowserWindow.getAllWindows().length===0){
        createWindow()
    }
    
})
ipcMain.on('save_buffer',(e,buffer)=>{
    const filePath = path.join(destination,`${Date.now()}`)
    fs.writeFileSync(`${filePath}.webm`,buffer)
})

ipcMain.handle('show-dialog',async (event)=>{
    const result = await dialog.showOpenDialog({properties:['openDirectory']})

    const dirPath = result.filePaths[0]
    preferences.set('destination',dirPath)
    destination=preferences.get('destination')

    return destination

})