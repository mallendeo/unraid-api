# unraid-api

Unofficial API for Unraid

```bash
yarn add unraid-api
```

## Init

```ts
import unraid from 'unraid-api'

unraid.setAuth('root:password')
unraid.setHost('https://Tower.local')
```
## Available methods

```ts
setAuth(auth: string)
setHost(host: string)
setSecure(secure: boolean) // ignore ssl certificate if false
renewCsrf()

getConfig()
getMAC()
getDisks()

unlockArray(encryptionKey: string)
startArray()
stopArray()

getVMs()
getVM(uuid: string)
startVM(uuid: string)
stopVM(uuid: string)

reboot()
poweroff()
```

# License

GNU General Public License v3.0
