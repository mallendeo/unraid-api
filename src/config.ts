import dotenv from 'dotenv'
import yn from 'yn'

dotenv.config()

const {
  UNRAID_AUTH,
  UNRAID_HOST = 'https://Tower.local',
  VERIFY_CERT,
  UNRAID_ENC_KEY,
  MAC_ADDRESS,
} = process.env

export default {
  unraid: {
    auth: UNRAID_AUTH,
    host: UNRAID_HOST,
    encriptionKey: UNRAID_ENC_KEY,
    secure: yn(VERIFY_CERT, { default: false }),
    mac: MAC_ADDRESS,
  },
}
