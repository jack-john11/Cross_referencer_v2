import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import Busboy from 'busboy'
import * as path from 'path'
import * as os from 'os'
import * as fs from 'fs'
import { v4 as uuidv4 } from 'uuid'
import { FileDocument, PROJECT_COLLECTION, FILES_SUBCOLLECTION, AUDIT_ACTIONS } from '@ecologen/shared-types'

const db = admin.firestore()
const storage = admin.storage().bucket()

export const uploadFile = functions.https.onRequest((req, res) => {
  // Use CORS to allow requests from the web app
  res.set('Access-Control-Allow-Origin', '*')
  res.set('Access-Control-Allow-Methods', 'POST')
  res.set('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.status(204).send('')
    return
  }

  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed')
    return
  }

  const busboy = Busboy({ headers: req.headers })
  const tmpdir = os.tmpdir()

  const fields: { [key: string]: string } = {}
  const uploads: { [key: string]: string } = {}
  let fileData: { fieldname: string; filename: string; encoding: string; mimetype: string; } | null = null


  busboy.on('field', (fieldname, val) => {
    fields[fieldname] = val
  })

  busboy.on('file', (fieldname, file, fileInfo) => {
    const { filename, encoding, mimeType } = fileInfo
    const filepath = path.join(tmpdir, filename)
    uploads[fieldname] = filepath
    file.pipe(fs.createWriteStream(filepath))
    fileData = { fieldname, filename, encoding, mimetype: mimeType }
  })

  busboy.on('finish', async () => {
    try {
      const { projectId, documentType, userId } = fields
      if (!projectId || !documentType || !userId) {
        res.status(400).send({ error: 'Missing required fields: projectId, documentType, userId' })
        return
      }
      
      const fileUploads = Object.entries(uploads)
      if (fileUploads.length === 0) {
        res.status(400).send({ error: 'No file uploaded' })
        return
      }

      const [fieldname, fpath] = fileUploads[0]
      const file = fs.readFileSync(fpath)
      const fileName = path.basename(fpath)
      const fileType = path.extname(fileName)
      const timestamp = Date.now()
      const storagePath = `projects/${projectId}/${documentType}/${timestamp}_${fileName}`

      await storage.file(storagePath).save(file)

      const fileId = uuidv4()
      const fileDoc: FileDocument = {
        id: fileId,
        fileName,
        storagePath,
        fileType,
        size: file.length,
        status: 'uploaded',
        createdAt: new Date(),
        userId,
        correlationId: uuidv4(),
      }

      await db
        .collection(PROJECT_COLLECTION)
        .doc(projectId)
        .collection(FILES_SUBCOLLECTION)
        .doc(fileId)
        .set(fileDoc)

      // Add audit trail to project
      await db.collection(PROJECT_COLLECTION).doc(projectId).update({
        auditTrail: {
          action: AUDIT_ACTIONS.FILE_UPLOAD,
          userId,
          timestamp: new Date(),
        },
      })
      
      fs.unlinkSync(fpath)
      
      res.status(200).send({ success: true, file: fileDoc })
    } catch (error) {
      console.error('Upload failed:', error)
      res.status(500).send({ success: false, error: 'File upload failed' })
    }
  })

  busboy.end(req.rawBody)
})
