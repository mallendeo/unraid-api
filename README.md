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
unraid.setSecure(false) // ignore ssl certificate
```

or provide `UNRAID_AUTH`, `UNRAID_HOST`, or `UNRAID_SECURE` env vars.

## Available methods

```ts
setAuth(auth: string)
setHost(host: string)
setSecure(secure: boolean)
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
stopVM(uuid: string, force?: boolean)

reboot()
poweroff()
```

# License

GNU General Public License v3.0
