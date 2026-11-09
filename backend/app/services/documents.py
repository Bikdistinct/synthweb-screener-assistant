import io
import httpx
import pymupdf
from ..config import settings

class DocumentError(ValueError): pass

def extract_pdf(data: bytes) -> str:
    try:
        doc = pymupdf.open(stream=data, filetype="pdf")
        text = "\n".join(page.get_text("text") for page in doc).strip()
        if len(text) >= 80:
            return text
    except Exception as exc:
        raise DocumentError("This PDF could not be opened. Please upload a valid PDF.") from exc

    if settings.ocr_space_api_key:
        try:
            response = httpx.post(
                "https://api.ocr.space/parse/image",
                data={"apikey": settings.ocr_space_api_key, "language": "eng", "isOverlayRequired": "false"},
                files={"file": ("resume.pdf", data, "application/pdf")},
                timeout=90
            )
            response.raise_for_status()
            payload = response.json()
            if not payload.get("IsErroredOnProcessing"):
                parsed = "\n".join(x.get("ParsedText", "") for x in payload.get("ParsedResults", []))
                if len(parsed.strip()) >= 40:
                    return parsed.strip()
        except Exception:
            pass

    if settings.ocr_local_enabled:
        try:
            import pytesseract
            from PIL import Image
            doc = pymupdf.open(stream=data, filetype="pdf")
            pages = []
            for page in doc:
                # pix = page.get_pixmap(matrix=fitz.Matrix(2, 2), alpha=False)
                pix = page.get_pixmap(matrix=pymupdf.Matrix(2, 2), alpha=False)
                image = Image.open(io.BytesIO(pix.tobytes("png")))
                pages.append(pytesseract.image_to_string(image))
            text = "\n".join(pages).strip()
            if len(text) >= 40:
                return text
        except Exception:
            pass
    raise DocumentError("No readable text was found. This may be a scanned PDF. Configure OCR_SPACE_API_KEY or local Tesseract OCR, or paste the resume text.")

from docx import Document

def extract_docx(data: bytes) -> str:
    try:
        doc = Document(io.BytesIO(data))

        parts = [p.text.strip() for p in doc.paragraphs if p.text.strip()]

        # Include table content as well.
        for table in doc.tables:
            for row in table.rows:
                cells = [cell.text.strip() for cell in row.cells]
                row_text = " | ".join(cell for cell in cells if cell)
                if row_text:
                    parts.append(row_text)

        text = "\n".join(parts).strip()

        if len(text) < 40:
            raise DocumentError("No readable text was found in the DOCX job description.")

        return text

    except DocumentError:
        raise
    except Exception as exc:
        raise DocumentError("This DOCX could not be opened. Please upload a valid DOCX file.") from exc