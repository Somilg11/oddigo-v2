# Coupons API

**Base URL:** `/api/coupons`
**Auth Required:** Yes (any logged-in user for validation)

---

## 1. POST `/api/coupons/validate`

Validate a coupon code before applying to a job.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| code | string | yes | Coupon code |
| jobAmount | number | no | For percentage discount calculation and min order check |
| categoryId | string | no | To check `applicableCategories` |

**Example:**
```json
{
  "code": "SUMMER10",
  "jobAmount": 1500,
  "categoryId": "64b2c3d4..."
}
```

#### Response (200)
```json
{
  "success": true,
  "data": {
    "valid": true,
    "code": "SUMMER10",
    "discountType": "PERCENTAGE",
    "discountValue": 10,
    "maxDiscount": 200,
    "description": "10% off on all services, max ₹200",
    "calculatedDiscount": 150,
    "message": "Coupon applied! You save ₹150"
  }
}
```

#### Error Responses
| Status | Message |
|--------|---------|
| 400 | `"Coupon code is required"` |
| 400 | `"Minimum order amount is ₹500"` |
| 400 | `"This coupon has expired"` |
| 400 | `"This coupon has reached its usage limit"` |
| 400 | `"You have already used this coupon"` |
| 400 | `"This coupon is not applicable for this category"` |
| 400 | `"Invalid coupon code"` |

---

## Coupon Types

| Type | Behavior |
|------|----------|
| `PERCENTAGE` | `value` = percentage off. `maxDiscount` caps the amount. Requires `jobAmount`. |
| `FLAT` | `value` = flat ₹ discount. e.g. `value: 100` = ₹100 off. |
| `FREE_DELIVERY` | Waives the visit/delivery fee. |

---

## Admin Coupon Management

Coupon CRUD is handled via admin endpoints. See [ADMIN.md](./ADMIN.md#coupons).
