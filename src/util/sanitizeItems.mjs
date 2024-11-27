/**
 * Sanitizes and enhances the item model provided to include more UI friendly "privileges".
 *
 * @export
 * @param {EmbeddedItemModel} itemModel - The raw ItemModel.
 * @param {string} userId - The user ID of the logged in/requesting user.
 * @param {EmbeddedListModel} listModel - The raw ListModel.
 */
export function sanitizeItemAttributes(itemModel, userId, listModel) {
    const purchaseAttributes = generatePurchaseAttributes(itemModel, userId)
    itemModel.retractablePurchase = purchaseAttributes.retractablePurchase
    itemModel.purchaseState = purchaseAttributes.purchaseState
    itemModel.purchasesAllowed = purchaseAttributes.purchasesAllowed
    itemModel.quantityPurchased = purchaseAttributes.quantityPurchased
    itemModel.deleteAllowed = calculateDeleteAllowed(itemModel, userId)
    itemModel.editAllowed = calculateEditAllowed(itemModel, userId)
    itemModel.canViewMetadata = !checkIfRequesterIsListOwner(listModel, userId)
    delete itemModel.purchaseDetails
    delete itemModel.purchased
}

/**
 * Sanitizes and enhances the list model provided to include more UI friendly "privileges".
 *
 * @export
 * @param {EmbeddedItemModel} itemModel - The raw ItemModel.
 * @param {string} userId - The user ID of the logged in/requesting user.
 */
export function sanitizeListAttributes(listModel, userId) {
    const ownedList = checkIfRequesterIsListOwner(listModel, userId)
    listModel.canViewMetadata = !ownedList
    if (ownedList) {
        listModel.items = listModel.items.filter(item => item.offListItem !== true)
    }
    listModel.items.forEach(item => {
        sanitizeItemAttributes(item, userId, listModel)
    })
}

/**
 * Description placeholder
 *
 * @param {EmbeddedItemModel} itemModel - The raw ItemModel.
 * @param {string} userId - The user ID of the logged in/requesting user.
 * @returns {{ purchaseState: any; quantityPurchased: any; retractablePurchase: boolean; purchasesAllowed: boolean; }}
 */
function generatePurchaseAttributes(itemModel, userId) {
    const state = calculatePurchaseState(itemModel, userId)
    const purchasesAllowed = calculatePurchasesAllowed(itemModel, userId, state)

    return {
        purchaseState: state.purchaseState,
        quantityPurchased: state.quantityPurchased,
        retractablePurchase: state.retractablePurchase,
        purchasesAllowed: purchasesAllowed
    }
}

/**
 * Description placeholder
 *
 * @param {*} itemModel
 * @param {*} userId
 * @param {*} state
 * @returns {boolean}
 */
function calculatePurchasesAllowed(itemModel, userId, state) {
    const allowedState = (state.purchaseState === "available") || (state.purchaseState === "partial")
    const allowedUser = !checkIfRequesterIsItemOwner(itemModel, userId)
    return allowedState && allowedUser
}

/**
 * Description placeholder
 *
 * @param {*} listModel
 * @param {*} userId
 * @returns {boolean}
 */
function checkIfRequesterIsListOwner(listModel, userId) {
    return userId === listModel.owner
}

function checkIfRequesterIsItemOwner(itemModel, userId) {
    return userId === itemModel.createdBy
}

/**
 * Description placeholder
 *
 * @param {*} itemModel
 * @param {*} userId
 * @returns {boolean}
 */
function calculateEditAllowed(itemModel, userId) {
    return checkIfRequesterIsItemOwner(itemModel, userId)
}

/**
 * Description placeholder
 *
 * @param {*} itemModel
 * @param {*} userId
 * @returns {boolean}
 */
function calculateDeleteAllowed(itemModel, userId) {
    return checkIfRequesterIsItemOwner(itemModel, userId)
}

/**
 * Description placeholder
 *
 * @export
 * @param {*} itemModel
 * @param {*} userId
 * @returns {{ retractablePurchase: boolean; purchaseState: any; quantityPurchased: any; }}
 */
export function calculatePurchaseState(itemModel, userId) {
    
    const PurchaseStateEnum = Object.freeze({
        AVAILABLE: "available",
        PURCHASED: "purchased",
        PARTIAL: "partial",
        UNAVAILABLE: "unavailable"

    });

    const purchaseInfo = itemModel.purchaseDetails
    if (purchaseInfo == null) {
        return {
            retractablePurchase: false,
            purchaseState: PurchaseStateEnum.AVAILABLE,
            quantityPurchased: 0,
        }
    }

    if (purchaseInfo.purchasers.length == 0) {
        return {
            retractablePurchase: false,
            purchaseState: PurchaseStateEnum.AVAILABLE,
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
                purchaseState: PurchaseStateEnum.PARTIAL,
                quantityPurchased: totalPurchases,
            }
        }

        if (!maxPurchasesReached && userIsPurchaser) {
            return {
                retractablePurchase: true,
                purchaseState: PurchaseStateEnum.PARTIAL,
                quantityPurchased: totalPurchases,
            }
        }

        if (userIsPurchaser && maxPurchasesReached) {
            return {
                retractablePurchase: true,
                purchaseState: PurchaseStateEnum.PURCHASED,
                quantityPurchased: totalPurchases
            }
        }

        if (maxPurchasesReached) {
            return {
                retractablePurchase: false,
                purchaseState: PurchaseStateEnum.UNAVAILABLE,
                quantityPurchased: totalPurchases,
            }
        }
    }
    return {
        retractablePurchase: false,
        purchaseState: PurchaseStateEnum.UNAVAILABLE,
        quantityPurchased: 0,
    }
}

export default { sanitizeListAttributes, sanitizeItemAttributes, calculatePurchaseState };