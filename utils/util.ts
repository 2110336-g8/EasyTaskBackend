import fs from 'fs';

export async function convertImageToBase64(imgPath: string): Promise<string> {
    try {
        const data = await fs.promises.readFile(imgPath);
        const base64Image = Buffer.from(data).toString('base64');
        return base64Image;
    } catch (error) {
        console.log(error);
        throw error;
    }
}
