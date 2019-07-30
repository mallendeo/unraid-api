import got from 'got'
import cheerio from 'cheerio'
import JSON5 from 'json5'

const VM_AJAX = 'plugins/dynamix.vm.manager/include/VMajax.php'

let token: string
let auth: string
let host = 'https://Tower.local'
let secure = false

export const setAuth = (_auth: string) => (auth = _auth)
export const setHost = (_host: string) => (host = _host)
export const setSecure = (_secure: boolean) => (secure = _secure)

export const getConfig = async () => {
  const { body: html } = await got.get('Main')
  const configStr = html.match(/display[\s\S]+vars\s+=(.+);/)[1].trim()
  return JSON.parse(configStr)
}

const post = async (path: string, form = {}) => {
  if (!auth) throw Error(`You must set the auth string using 'setAuth'`)

  token = token || (await getConfig()).csrf_token
  const { body } = await got.post(path, {
    form: true,
    baseUrl: host,
    rejectUnauthorized: secure,
    auth,
    body: {
      ...form,
      ['csrf_token']: token,
    },
  })

  return body
}

const update = async (form = {}, htm = false) =>
  post(`update.${htm ? 'htm' : 'php'}`, {
    ...form,
    ['csrf_token']: token,
  })

export const getMAC = async () => {
  const { body } = await got.get('Settings/NetworkSettings')
  const $ = cheerio.load(body)
  return $('#index-eth0-0')
    .find('.big')
    .first()
    .text()
}

export const unlockArray = async (password: string) => {
  if (!password) throw Error(`'password' parameter required!`)

  const body = await update({
    '#file': 'unused',
    '#include': 'webGui/include/KeyUpload.php',
    text: password,
    file: '',
  })

  return body
}

export const startArray = async () =>
  update({ startState: 'STOPPED', cmdStart: 'Start' }, true)

export const stopArray = async () =>
  update({ startState: 'STARTED', cmdStart: 'Stop' }, true)

export const getVMs = async () => {
  const { body } = await got.get(
    'plugins/dynamix.vm.manager/include/VMMachines.php'
  )

  const vms = body
    .match(/addVMContext\((.+?)\);/g)
    .map(str => str.match(/\((.+)\);/)[1])
    .map(str => JSON5.parse(`[${str}]`))
    .map(vm => ({ name: vm[0], uuid: vm[1], os: vm[2], state: vm[3] }))

  return vms
}

// TODO: Add other PCI devices
export const getVM = async (uuid: string) => {
  const { body } = await got.get('VMs/UpdateVM', { query: { uuid } })
  const $ = cheerio.load(body)

  return {
    uuid: $('[name="domain[uuid]"]').val(),
    icon: $('#template_img').attr('src'),
    autostart: !!$('[name="domain[desc]"]').attr('checked'),
    name: $('[name="domain[name]"]').val(),
    description: $('[name="domain[desc]"]').val(),
    cpuMode: {
      value: $('[name="domain[cpumode]"]').val(),
      text: $('[name="domain[cpumode]"] option:selected').text(),
    },
    cpus: $('[class^="cpu"].checkbox')
      .map((i, el) => ({
        pairs: $(el).text(),
        num: $(el)
          .find('input')
          .val(),
        assigned: !!$(el)
          .find('input')
          .attr('checked'),
      }))
      .get(),
    memory: $('[name="domain[mem]"]').val(),
    maxMemory: $('[name="domain[maxmem]"]').val(),
    machine: $('[name="domain[machine]"]').val(),
    bios: $('[name="domain[ovmf]"]').val(),
    hyperv: $('[name="domain[hyperv]"]').val(),
    usbmode: $('[name="domain[usbmode]"]').val(),
    media: {
      cdrom: $('[name="media[cdrom]"]').val(),
      drivers: $('[name="media[drivers]"]').val(),
    },
    disks: $('[data-category="vDisk"]')
      .map((i, el) => ({
        locationType: $(el)
          .find('.disk_select option:selected')
          .text(),
        location: $(el)
          .find('input.disk')
          .val(),
        bus: $(el)
          .find('.disk_bus option:selected')
          .text(),
      }))
      .get(),
    gpus: $('[data-category="Graphics_Card"]')
      .map((i, el) => ({
        name: $(el)
          .find('.gpu option:selected')
          .text(),
        romBios: $(el)
          .find('input[data-pickfilter="rom,bin"]')
          .val(),
      }))
      .get(),
    soundCards: $('[data-category="Sound_Card"]')
      .map((i, el) => ({
        name: $(el)
          .find('.audio option:selected')
          .text(),
      }))
      .get(),
    nics: $('[data-category="Network"]')
      .map((i, el) => ({
        mac: $(el)
          .find('input')
          .first()
          .val(),
        bridge: $(el)
          .find('select option:selected')
          .text(),
      }))
      .get(),
    usb: $('[name="usb[]"]')
      .map((i, el) => ({
        name: $(el)
          .parent('label')
          .text()
          .trim(),
        value: $(el).val(),
      }))
      .get(),
  }
}

export const startVM = async (uuid: string) =>
  post(VM_AJAX, {
    action: 'domain-start',
    uuid,
  })

export const stopVM = async (uuid: string, force = false) =>
  post(VM_AJAX, {
    action: force ? 'destroy' : 'domain-stop',
    uuid,
  })

export const getDisks = async () => {
  const devices = ['array', 'cache', 'flash', 'parity']

  const htmls = await Promise.all(
    devices.map(device =>
      post('webGui/include/DeviceList.php', {
        path: 'Main',
        device,
      })
    )
  )

  return htmls
    .map(html => {
      const $ = cheerio.load(`<table>${html}</table>`)

      const getCell = (el: any, cell: number, split = false) => {
        const found = $(el).find(`td:nth-child(${cell})`)
        return split
          ? found
              .find('*')
              .map((i, el) => $(el).text())
              .get()
          : found.text()
      }

      return $('tr:not(.tr_last)')
        .filter((i, el) => !!$(el).html().length)
        .map((i, el) => ({
          name: getCell(el, 2),
          temp: getCell(el, 3),
          read: getCell(el, 4, true),
          writes: getCell(el, 5, true),
          errors: getCell(el, 6),
          format: getCell(el, 7),
          size: getCell(el, 8),
          usage: getCell(el, 9),
          free: getCell(el, 10),
        }))
        .get()
    })
    .reduce((obj, curr, index) => {
      obj[devices[index]] = curr
      return obj
    }, {})
}

export const reboot = async () =>
  post('webGui/include/Boot.php', { cmd: 'reboot' })

export const poweroff = async () =>
  post('webGui/include/Boot.php', { cmd: 'shutdown' })
