export function sanitizeItemAttributes(itemModel, userId) {
    const purchaseAttributes = generatePurchaseAttributes(itemModel, userId)
    itemModel.retractablePurchase = purchaseAttributes.retractablePurchase
    itemModel.purchaseState = purchaseAttributes.purchaseState
    itemModel.purchasesAllowed = purchaseAttributes.purchasesAllowed
    itemModel.quantityPurchased = purchaseAttributes.quantityPurchased
    itemModel.deleteAllowed = calculateDeleteAllowed(itemModel, userId)
    itemModel.editAllowed = calculateEditAllowed(itemModel, userId)
    delete itemModel.purchaseDetails
    delete itemModel.purchased
}

export function sanitizeListAttributes(listModel, userId) {
    if (userId === listModel.owner) {
        listModel.items = listModel.items.filter(item => item.offListItem !== true)
    }
    listModel.items.forEach(item => {
        sanitizeItemAttributes(item, userId)
    })
}

function generatePurchaseAttributes(itemModel, userId) {
    const state = calculatePurchaseState(itemModel, userId)
    const purchasesAllowed = calculatePurchasesAllowed(itemModel, userId)

    return {
        purchaseState: state.purchaseState,
        quantityPurchased: state.quantityPurchased,
        retractablePurchase: state.retractablePurchase,
        purchasesAllowed: purchasesAllowed
    }
}

function calculatePurchasesAllowed(itemModel, userId) {
    return userId !== itemModel.createdBy
}

function calculateEditAllowed(itemModel, userId) {
    return userId === itemModel.createdBy
}

function calculateDeleteAllowed(itemModel, userId) {
    return userId === itemModel.createdBy
}

export function calculatePurchaseState(itemModel, userId) {
    
    const PurhcaseStateEnum = Object.freeze({
        AVAILABLE: "available",
        PURCHASED: "purchased",
        PARTIAL: "partial",
        UNAVAILABLE: "unavailable"

    });

    const purchaseInfo = itemModel.purchaseDetails
    if (purchaseInfo == null) {
        return {
            retractablePurchase: false,
            purchaseState: PurhcaseStateEnum.AVAILABLE,
            quantityPurchased: 0,
        }
    }

    if (purchaseInfo.purchasers.length == 0) {
        return {
            retractablePurchase: false,
            purchaseState: PurhcaseStateEnum.AVAILABLE,
            quantityPurchased: 0,
        }
    }

    if (purchaseInfo.purchasers.length > 0) {

        const userIsPurchaser = purchaseInfo.purchasers.some((obj) => obj.purchaserId === userId);
        var totalPurchases = purchaseInfo.purchasers.reduce((n, {quantityPurchased}) => n + quantityPurchased, 0)
        const maxPurchasesReached = totalPurchases >= itemModel.quantity

        if (!maxPurchasesReached && !userIsPurchaser) {
            return {
                retractablePurchase: false,
                purchaseState: PurhcaseStateEnum.PARTIAL,
                quantityPurchased: totalPurchases,
            }
        }

        if (!maxPurchasesReached && userIsPurchaser) {
            return {
                retractablePurchase: true,
                purchaseState: PurhcaseStateEnum.PARTIAL,
                quantityPurchased: totalPurchases,
            }
        }

        if (userIsPurchaser && maxPurchasesReached) {
            return {
                retractablePurchase: true,
                purchaseState: PurhcaseStateEnum.PURCHASED,
                quantityPurchased: totalPurchases
            }
        }

        if (maxPurchasesReached) {
            return {
                retractablePurchase: false,
                purchaseState: PurhcaseStateEnum.UNAVAILABLE,
                quantityPurchased: totalPurchases,
            }
        }
    }
    return {
        retractablePurchase: false,
        purchaseState: PurhcaseStateEnum.UNAVAILABLE,
        quantityPurchased: 0,
    }
}

export default { sanitizeListAttributes, sanitizeItemAttributes, calculatePurchaseState };