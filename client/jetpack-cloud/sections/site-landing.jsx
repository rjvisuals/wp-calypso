import page from 'page';
import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import JetpackLogo from 'calypso/components/jetpack-logo';
import { jetpackDashboardRedirectLink } from 'calypso/state/jetpack-agency-dashboard/selectors';
import {
	hasFetchedPartner,
	isFetchingPartner,
} from 'calypso/state/partner-portal/partner/selectors';

import '../style.scss';

export default function SiteLanding( { primarySiteSlug, isPrimarySiteJetpackSite } ) {
	const hasFetched = useSelector( hasFetchedPartner );
	const isFetching = useSelector( isFetchingPartner );
	const dashboardRedirectLink = useSelector( jetpackDashboardRedirectLink );
	useEffect( () => {
		if ( hasFetched ) {
			isPrimarySiteJetpackSite ? page( `/landing/${ primarySiteSlug }` ) : page( `/landing` );
		}
	}, [ primarySiteSlug, hasFetched, isPrimarySiteJetpackSite, dashboardRedirectLink ] );

	return <>{ isFetching ? <JetpackLogo size={ 72 } className="sections__logo" /> : null }</>;
}
