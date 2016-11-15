
type TswitchAll = "open" | "close" | "switch";
type Tswitc = "open" | "close";

interface IRelaypin {
    normally?: Tswitc
    pin: number
    status?: Tswitc
    cmdopen?: () => Promise<true>
    cmdclose?: () => Promise<true>
}


import * as child_process from 'child_process'

import * as Promise from 'bluebird'


const exec = child_process.exec

export default class Relaypin implements IRelaypin {
    normally: Tswitc
    pin: number
    status: Tswitc
    cmdopen: () => Promise<true>
    cmdclose: () => Promise<true>
    switches: Function[]
    onopen: Function[]
    onclose: Function[]
    constructor(confpin: IRelaypin) {

        if (!confpin.pin) {
            throw Error("no pin number provided")
        } else {
            const that = this
            that.pin = confpin.pin
            if (confpin.normally) {
                that.normally = confpin.normally
            } else {
                that.normally = "open" // default normally
            }
            if (confpin.status) {
                that.status
            } else {
                that.status = that.normally
            }
            if (confpin.cmdopen) {
                that.cmdopen = confpin.cmdopen
            } else {
                that.cmdopen = function() {
                    return new Promise<true>(function(resolve, reject) {
                        exec('echo 1 > /sys/class/gpio/gpio' + that.pin + '/value', function(err, stout, stderr) {
                            if (err) {
                                reject(err)
                            } else {
                                status = 'open'
                                resolve(true)
                            }
                        })
                    })
                }
            }
            if (confpin.cmdclose) {
                that.cmdclose = confpin.cmdclose
            } else {
                that.cmdclose = function() {
                    return new Promise<true>(function(resolve, reject) {
                        exec('echo 0 > /sys/class/gpio/gpio' + that.pin + '/value', function(err, stout, stderr) {
                            if (err) {
                                reject(err)
                            } else {
                                status = 'closed'
                                resolve(true)
                            }
                        })
                    })
                }
            }

        }
    }


    switch() {
        const that = this
        return new Promise<true>(function(resolve, reject) {
            if (that.status) {
                that.switchclose()
            } else {
                that.switchopen()
            }
        })
    }
    switchopen() {
        const that = this
        return new Promise<true>(function(resolve, reject) {
            if (that.status === 'close') {
                that.cmdopen().then(function() {
                    for (let i = 0; i < that.onopen.length; i++) {
                        that.onopen[i]
                    }
                }).catch(function(err) {
                    console.log(err)
                })
            }
        })
    }
    switchclose() {
        const that = this
        return new Promise<true>(function(resolve, reject) {
            if (that.status === 'close') {
                that.cmdclose().then(function() {
                    for (let i = 0; i < that.onclose.length; i++) {
                        that.onclose[i]
                    }
                }).catch(function(err) {
                    console.log(err)
                })
            }
        })
    }
    on(value: TswitchAll, cmd: Function) {
        if (cmd) {
            if (value === 'close') {
                this.onclose.push(cmd)
            } else if (value === 'open') {
                this.onopen.push(cmd)

            } else if (value === 'switch') {
                this.switches.push(cmd)

            } else {
                throw Error("no pin number provided")
            }

        } else {
            throw Error("no pin number provided")
        }
    }
}