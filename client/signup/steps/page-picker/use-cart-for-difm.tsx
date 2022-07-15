import { isEnabled } from '@automattic/calypso-config';
import {
	PLAN_PREMIUM,
	PLAN_WPCOM_PRO,
	WPCOM_DIFM_EXTRA_PAGE,
	WPCOM_DIFM_LITE,
} from '@automattic/calypso-products';
import formatCurrency from '@automattic/format-currency';
import { useShoppingCart } from '@automattic/shopping-cart';
import { LocalizeProps, useTranslate } from 'i18n-calypso';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getCurrentUserCurrencyCode } from 'calypso/state/currency-code/selectors';
import { buildDIFMCartExtrasObject } from 'calypso/state/difm/assemblers';
import { requestProductsList } from 'calypso/state/products-list/actions';
import { getProductBySlug } from 'calypso/state/products-list/selectors';
import { getSignupDependencyStore } from 'calypso/state/signup/dependency-store/selectors';
import { fetchSitePlans } from 'calypso/state/sites/plans/actions';
import { getSiteId } from 'calypso/state/sites/selectors';
import type { ResponseCart } from '@automattic/shopping-cart';
import type { ProductListItem } from 'calypso/state/products-list/selectors/get-products-list';
import type { TranslateResult } from 'i18n-calypso';

export type CartItem = {
	nameOverride?: TranslateResult;
	productSlug: string;
	productOriginalName: string;
	productCost: number;
	meta?: TranslateResult;
	productCount?: number;
	lineCost: number;
};

const FREE_PAGES = 5;

type DummyCartParams = {
	selectedPages: string[];
	currencyCode: string;
	activePlanScheme: ProductListItem;
	difmLiteProduct: ProductListItem;
	extraPageProduct: ProductListItem;
	translate: LocalizeProps[ 'translate' ];
};

function getDummyCartProducts( {
	selectedPages,
	currencyCode,
	activePlanScheme,
	difmLiteProduct,
	extraPageProduct,
	translate,
}: DummyCartParams ): CartItem[] {
	const extraPageCount = Math.max( 0, selectedPages.length - FREE_PAGES );
	let displayedCartItems: CartItem[] = [];
	if ( difmLiteProduct && activePlanScheme && extraPageProduct ) {
		displayedCartItems = [
			{
				nameOverride: translate( 'Website Design Service' ),
				productSlug: difmLiteProduct.product_slug,
				productOriginalName: difmLiteProduct.product_name,
				lineCost: difmLiteProduct.cost,
				productCost: difmLiteProduct.cost,
				meta: translate( 'One-time fee' ),
			},
			{
				productSlug: difmLiteProduct.product_slug,
				productOriginalName: activePlanScheme.product_name,
				lineCost: activePlanScheme.cost,
				productCost: activePlanScheme.cost,
				meta: translate( 'Plan Subscription: %(planPrice)s per year', {
					args: {
						planPrice: formatCurrency( activePlanScheme.cost, currencyCode, { precision: 0 } ),
					},
				} ),
			},

			{
				nameOverride: `${ extraPageCount } ${
					extraPageCount === 1 ? translate( 'Extra Page' ) : translate( 'Extra Pages' )
				}`,

				productSlug: difmLiteProduct.product_slug,
				productOriginalName: extraPageProduct.product_name,
				productCost: extraPageProduct.cost,
				meta: translate( '%(perPageCost)s Per Page', {
					args: {
						perPageCost: formatCurrency( extraPageProduct.cost, currencyCode, { precision: 0 } ),
					},
				} ),
				lineCost: extraPageProduct.cost * extraPageCount,
				productCount: extraPageCount,
			},
		];
	}

	return displayedCartItems;
}

function getSiteCartProducts( {
	responseCart,
	extraPageProduct,
	translate,
}: {
	responseCart: ResponseCart;
	extraPageProduct: ProductListItem;
	translate: LocalizeProps[ 'translate' ];
} ): CartItem[] {
	const cartItems: CartItem[] = responseCart.products.map( ( product ) => {
		switch ( product.product_slug ) {
			case PLAN_WPCOM_PRO:
				return {
					productSlug: product.product_slug,
					productOriginalName: product.product_name,
					lineCost: product.cost,
					productCost: product.cost,
					meta: translate( 'Plan Subscription: %(planPrice)s per year', {
						args: { planPrice: product.product_cost_display },
					} ),
				};
			case WPCOM_DIFM_LITE:
				return {
					productSlug: product.product_slug,
					nameOverride: 'Website Design Service',
					productOriginalName: product.product_name,
					lineCost: product.cost,
					productCost: product.cost,
					meta: translate( 'One-time fee' ),
				};
			case WPCOM_DIFM_EXTRA_PAGE:
				return {
					productSlug: product.product_slug,
					nameOverride: `${ product.quantity } ${
						product.quantity === 1 ? translate( 'Extra Page' ) : translate( 'Extra Pages' )
					}`,
					productOriginalName: product.product_name,
					lineCost: product.cost,
					productCost: product.cost,
					meta: product.item_original_cost_for_quantity_one_display + ' ' + translate( 'Per Page' ),
				};

			default:
				return {
					productSlug: product.product_slug,
					nameOverride: 'Website Design Service',
					productOriginalName: product.product_name,
					lineCost: product.cost,
					productCost: product.cost,
					meta: translate( 'One-time fee' ),
				};
		}
	} );

	if ( ! cartItems.some( ( c ) => c.productSlug === WPCOM_DIFM_EXTRA_PAGE ) ) {
		cartItems.push( {
			productSlug: extraPageProduct.product_slug,
			productOriginalName: extraPageProduct.product_name,
			lineCost: 0,
			productCost: extraPageProduct.cost,
			nameOverride: `0 ${ translate( 'Extra Pages' ) }`,
			meta: extraPageProduct.item_original_cost_for_quantity_one_display + translate( ' Per Page' ),
		} );
	}
	return cartItems;
}

const debounce = ( callback: ( ...args: any[] ) => any, timeout: number ) => {
	let timeoutId: number | undefined = undefined;
	return ( ...args: any[] ) => {
		window.clearTimeout( timeoutId );
		timeoutId = window.setTimeout( () => {
			callback( ...args );
		}, timeout );
	};
};

export function useCartForDIFM( selectedPages: string[] ): {
	items: CartItem[];
	total: string | null;
	isLoading: boolean;
	isPendingUpdate: boolean;
	isCartUpdateStarted: boolean;
} {
	//This state is used by loader states to provide immediate feedback when a deebounced change happens to a cart
	const [ isCartUpdateStarted, setIsCartUpdateStarted ] = useState( false );

	const signupDependencies = useSelector( getSignupDependencyStore );
	const translate = useTranslate();
	const dispatch = useDispatch();
	const proPlan = useSelector( ( state ) => getProductBySlug( state, PLAN_WPCOM_PRO ) );
	const premiumPlan = useSelector( ( state ) => getProductBySlug( state, PLAN_PREMIUM ) );
	const activePremiumPlanScheme = isEnabled( 'plans/pro-plan' ) ? proPlan : premiumPlan;
	const { newOrExistingSiteChoice, siteId, siteSlug } = signupDependencies;

	const extraPageProduct = useSelector( ( state ) =>
		getProductBySlug( state, WPCOM_DIFM_EXTRA_PAGE )
	);
	const difmLiteProduct = useSelector( ( state ) => getProductBySlug( state, WPCOM_DIFM_LITE ) );

	const currencyCode = useSelector( getCurrentUserCurrencyCode );

	const cartKey = useSelector( ( state ) => getSiteId( state, siteSlug ?? siteId ) );
	const { replaceProductsInCart, responseCart, isLoading, isPendingUpdate } = useShoppingCart(
		cartKey ?? undefined
	);

	const serializedDifmProduct = JSON.stringify( difmLiteProduct );
	const serializedSignupDependencies = JSON.stringify( signupDependencies );
	const getDifmLiteCartProduct = useCallback( () => {
		if ( difmLiteProduct ) {
			return {
				...difmLiteProduct,
				extra: buildDIFMCartExtrasObject( {
					...signupDependencies,
					selectedPageTitles: selectedPages,
				} ),
			};
		}
		return null;
	}, [ serializedSignupDependencies, selectedPages, serializedDifmProduct ] );

	// As soon as page selection changes show some feedback to the user
	useEffect( () => {
		setIsCartUpdateStarted( true );
	}, [ setIsCartUpdateStarted, selectedPages ] );

	useEffect( () => {
		siteId && dispatch( fetchSitePlans( siteId ) );
		dispatch( requestProductsList() );
	}, [ dispatch, siteId ] );

	const debouncedReplaceProductsInCart = useMemo(
		() =>
			debounce( async ( products ) => {
				await replaceProductsInCart( products );
				setIsCartUpdateStarted( false );
			}, 800 ),
		[]
	);

	useEffect( () => {
		if ( newOrExistingSiteChoice === 'existing-site' ) {
			const difmLiteProduct = getDifmLiteCartProduct();
			if ( difmLiteProduct && difmLiteProduct.product_slug ) {
				debouncedReplaceProductsInCart( [ difmLiteProduct ] );
			}
		}
	}, [ newOrExistingSiteChoice, getDifmLiteCartProduct, debouncedReplaceProductsInCart ] );

	let displayedCartItems: CartItem[] = [];
	if ( extraPageProduct && difmLiteProduct && activePremiumPlanScheme ) {
		if ( newOrExistingSiteChoice === 'existing-site' ) {
			displayedCartItems = getSiteCartProducts( { responseCart, translate, extraPageProduct } );
		} else {
			displayedCartItems = getDummyCartProducts( {
				selectedPages,
				currencyCode: currencyCode ?? 'USD',
				translate,
				activePlanScheme: activePremiumPlanScheme,
				difmLiteProduct,
				extraPageProduct,
			} );
		}
	}

	const totalCost = displayedCartItems.reduce(
		( total, currentProduct ) => currentProduct.lineCost + total,
		0
	);
	const totalCostFormatted = formatCurrency( totalCost, currencyCode ?? 'USD', { precision: 0 } );

	return {
		items: displayedCartItems,
		total: totalCostFormatted,
		isLoading,
		isPendingUpdate,
		isCartUpdateStarted,
	};
}

export default useCartForDIFM;
