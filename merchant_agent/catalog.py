"""
Ramana Mobile Hub / Mr. Ramana Mobile Accessories Catalog
High-quality mobile accessories catalog with rich attributes for realistic agent-to-agent negotiation.
"""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from shared.models import Product

CATALOG_PRODUCTS = [
    Product(
        product_id="gan-65w-charger",
        name="65W GaN Dual-Port Fast Charger (Type-C + USB-A)",
        description="Ultra-compact GaN fast charger with Power Delivery 3.0 & QuickCharge 4.0 support for iPhone, Samsung, MacBook",
        category="Charging",
        price_paise=149900,  # ₹1,499.00
    ),
    Product(
        product_id="braided-typec-cable",
        name="2m Braided 100W PD Type-C to Type-C Cable",
        description="Heavy-duty military nylon braided 100W fast charging & high-speed data sync cable (480Mbps)",
        category="Cables",
        price_paise=39900,   # ₹399.00
    ),
    Product(
        product_id="lightning-fast-cable",
        name="1.5m MFi Certified Fast Charging Cable (Lightning)",
        description="Apple MFi certified durable silicone lightning cable for iPhone 14/13/12/11 with 20W PD support",
        category="Cables",
        price_paise=49900,   # ₹499.00
    ),
    Product(
        product_id="magsafe-powerbank",
        name="10,000mAh Magnetic Wireless Power Bank (20W PD)",
        description="Strong MagSafe magnetic snap-on wireless power bank with kickstand & 22.5W wired USB-C output",
        category="Power Banks",
        price_paise=189900,  # ₹1,899.00
    ),
    Product(
        product_id="tempered-glass-pro",
        name="9H Edge-to-Edge HD Tempered Glass (Pack of 2)",
        description="Oleophobic anti-fingerprint 9H hardness shatterproof screen protector with auto-alignment tray",
        category="Screen Protection",
        price_paise=29900,   # ₹299.00
    ),
    Product(
        product_id="armor-shock-case",
        name="Military-Grade Shockproof Armor Case (Anti-Yellow)",
        description="Crystal-clear hybrid shock-absorbing bumper case with raised camera bezel & anti-yellowing tech",
        category="Cases & Covers",
        price_paise=59900,   # ₹599.00
    ),
    Product(
        product_id="tws-anc-earbuds",
        name="Pro ANC Wireless Earbuds (40h Playtime, Spatial Audio)",
        description="Active Noise Cancellation (ANC 35dB), dual transparency mode, IPX5 water resistance, low-latency gaming mode",
        category="Audio",
        price_paise=249900,  # ₹2,499.00
    ),
    Product(
        product_id="car-mount-magsafe",
        name="Auto-Clamping Wireless Car Charger & Dashboard Mount",
        description="Smart sensor auto-clamping 15W Qi fast wireless car charger mount with 360-degree rotation",
        category="Car Accessories",
        price_paise=119900,  # ₹1,199.00
    ),
    Product(
        product_id="bluetooth-receiver",
        name="Hi-Fi Bluetooth 5.3 Audio Receiver & Transmitter",
        description="Lossless aptX HD Bluetooth 5.3 audio adapter for car stereos, speakers, and home audio systems",
        category="Audio",
        price_paise=69900,   # ₹699.00
    ),
    Product(
        product_id="tripod-ringlight",
        name="Professional 12-inch LED Ring Light with 7ft Tripod",
        description="Studio-grade dimmable LED ring light with 3 color modes, Bluetooth shutter remote, and 360 phone holder",
        category="Creator Gear",
        price_paise=99900,   # ₹999.00
    ),
]


def format_catalog_for_display(products: list[Product]) -> list[dict]:
    """Format catalog products for API response with human-readable prices."""
    result = []
    for p in products:
        d = p.model_dump()
        d["price_display"] = f"₹{p.price_paise / 100:,.0f}"
        result.append(d)
    return result
