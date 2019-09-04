import * as cluster from 'cluster'
import { readFileSync } from 'fs'
import { cpus } from 'os'

import chalk from 'chalk'
import express = require('express')

main()

function main() {
	if (cluster.isMaster) {
		console.log(`Master ${process.pid} is running`)
		forkWorkers()
	} else {
		createServer()
	}
}

function createServer() {
	const app = express()

	app.get('/', (_req, res) => {
		res.status(200).end('hello world\n')
	})

	app.get('/download', (_req, res) => {
		res.status(200).write('downloading...')
		const contents = readFileSync(
			__dirname + '/ArchLinuxARM-rpi-4-latest.tar.gz',
		)
		res.end(contents.toString())
	})

	app.get('/kill', (_req, res) => {
		res.status(200).write(`Killing worker ${cluster.worker.process.pid}...`)
		cluster.worker.kill()
		res.end('done')
	})

	const server = app.listen(8000, () => {
		console.log(chalk.green(`Worker ${process.pid} started`))
	})

	return server
}

function forkWorkers() {
	const numCPUs = cpus().length

	console.log(`Forking ${numCPUs} workers`)

	for (let i = 0; i < numCPUs; i++) {
		cluster.fork()
	}

	cluster.on('disconnect', worker => {
		console.log(
			(worker.exitedAfterDisconnect ? chalk.yellow : chalk.red)(
				`Worker ${worker.process.pid} has ${
					worker.exitedAfterDisconnect ? 'gracefully' : 'unexpectedly'
				} disconnected`,
			),
		)
	})

	cluster.on('exit', (worker, code, signal) => {
		if (worker.exitedAfterDisconnect) {
			console.log(chalk.yellow(`Worker ${worker.process.pid} restarting...`))
		} else {
			console.log(
				chalk.red('Worker %d died (%s). Restarting...'),
				worker.process.pid,
				signal || code,
			)
		}

		cluster.fork()
	})
}
