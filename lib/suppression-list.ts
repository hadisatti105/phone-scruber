// This is a simple in-memory implementation
// In a real app, you would use a database
let suppressionList: string[] = []

// Track uploaded files for reference
interface UploadedFile {
  id: string
  name: string
  date: string
  count: number
}

let uploadedFiles: UploadedFile[] = []

export async function getSuppressionList(): Promise<string[]> {
  return suppressionList
}

export async function getUploadedFiles(): Promise<UploadedFile[]> {
  return uploadedFiles
}

export async function addToSuppressionList(numbers: string[], fileName?: string): Promise<void> {
  // Add unique numbers only
  const uniqueNumbers = numbers.filter((num) => !suppressionList.includes(num))
  suppressionList = [...suppressionList, ...uniqueNumbers]

  // If a file name is provided, add it to the uploaded files list
  if (fileName && uniqueNumbers.length > 0) {
    const fileId = Date.now().toString()
    uploadedFiles.push({
      id: fileId,
      name: fileName,
      date: new Date().toISOString(),
      count: uniqueNumbers.length,
    })
  }
}

export async function removeFromSuppressionList(number: string): Promise<void> {
  suppressionList = suppressionList.filter((num) => num !== number)
}

export async function removeMultipleFromSuppressionList(numbers: string[]): Promise<number> {
  const numbersSet = new Set(numbers)
  const initialLength = suppressionList.length

  suppressionList = suppressionList.filter((num) => !numbersSet.has(num))

  return initialLength - suppressionList.length
}

export async function removeFileFromSuppressionList(fileId: string): Promise<number> {
  // Find the file in the uploaded files list
  const fileIndex = uploadedFiles.findIndex((file) => file.id === fileId)

  if (fileIndex === -1) {
    return 0
  }

  // Remove the file from the uploaded files list
  const file = uploadedFiles[fileIndex]
  uploadedFiles = uploadedFiles.filter((f) => f.id !== fileId)

  // In a real implementation, you would have stored which numbers came from which file
  // For this demo, we'll simulate by removing a random set of numbers equal to the file's count
  // In a production app, you would track which numbers came from which file in a database

  // For demo purposes, we'll just remove the oldest numbers up to the count
  const numbersToRemove = Math.min(file.count, suppressionList.length)
  suppressionList = suppressionList.slice(numbersToRemove)

  return numbersToRemove
}

export async function clearSuppressionList(): Promise<void> {
  suppressionList = []
  uploadedFiles = []
}
