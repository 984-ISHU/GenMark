from fastapi import APIRouter, HTTPException, Query
import requests
from bs4 import BeautifulSoup

router = APIRouter()

@router.get("/scrape_product")
def scrape_product(url: str = Query(..., description="Product page URL")):
    headers = {
        "User-Agent": "Mozilla/5.0",
    }
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, "html.parser")
        
        # Example for Amazon — structure varies by site
        title = soup.find(id="productTitle")
        price = soup.find(id="priceblock_ourprice") or soup.find(id="priceblock_dealprice")
        desc = soup.find("meta", attrs={"name": "description"})
        image = soup.find("img", id="landingImage")

        return {
            "product_name": title.get_text(strip=True) if title else "",
            "price": price.get_text(strip=True).replace("₹", "").strip() if price else "",
            "description": desc["content"] if desc else "",
            "image": image["src"] if image else "",
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
