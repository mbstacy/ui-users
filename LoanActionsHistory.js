import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';
import { Row, Col } from 'react-bootstrap';
import KeyValue from '@folio/stripes-components/lib/KeyValue';
import MultiColumnList from '@folio/stripes-components/lib/MultiColumnList';
import Pane from '@folio/stripes-components/lib/Pane';
import Paneset from '@folio/stripes-components/lib/Paneset';
import { formatDate, futureDate, getFullName } from './util';

function getUserIdsMap(loans) {
  return loans.reduce((ids, l) => {
    ids[l.userId] = l.userId;
    return ids;
  }, {});
}

class LoanActionsHistory extends React.Component {

  static propTypes = {
    stripes: PropTypes.shape({
      locale: PropTypes.string.isRequired,
    }).isRequired,
    resources: PropTypes.shape({
      loanActionsHistory: PropTypes.object,
      users: PropTypes.object,
    }).isRequired,
    mutator: PropTypes.shape({
      userIds: PropTypes.shape({
        replace: PropTypes.func,
      }),
    }).isRequired,
    loan: PropTypes.object,
    user: PropTypes.object,
    onCancel: PropTypes.func.isRequired,
  };

  static manifest = Object.freeze({
    userIds: { initialValue: null },
    loanActionsHistory: {
      type: 'okapi',
      records: 'loans',
      GET: {
        path: 'loan-storage/loan-history?query=(id=!{loan.id})',
      },
    },
    users: {
      type: 'okapi',
      records: 'users',
      recordsRequired: '%{userIds}',
      path: 'users',
      GET: {
        params: {
          query: (queryParams, pathComponents, resourceValues) => {
            return 'active="true"';
          }
        },
        staticFallback: { params: {} },
      },
    },
  });

  componentWillReceiveProps(nextProps) {
    const resource = nextProps.resources.loanActionsHistory;
    if (resource && !resource.isPending && resource.records.length) {
      const userIds = getUserIdsMap(resource.records);
      this.props.mutator.userIds.replace(userIds);
    }
  }

  render() {
    const { onCancel, loan, user, stripes: { locale }, resources: { loanActionsHistory } } = this.props;
    if (!loanActionsHistory) return <div />;
    const loanActionsFormatter = {
      Action: la => _.startCase(la.action),
      'Action Date': la => formatDate(la.loanDate, locale),
      'Due Date': la => futureDate(la.loanDate, locale, 14),
      Operator: la => la.userId || '-',
    };

    return (
      <Paneset isRoot>
        <Pane id="pane-loandetails" defaultWidth="100%" dismissible onClose={onCancel} paneTitle={'Loan Details'}>
          <Row>
            <Col xs={5} >
              <Row>
                <Col xs={12}>
                  <KeyValue label="Title" value={_.get(loan, ['item', 'title'], '')} />
                </Col>
              </Row>
              <br />
              <Row>
                <Col xs={12}>
                  <KeyValue label="Loan Status" value={_.get(loan, ['status', 'name'], '-')} />
                </Col>
              </Row>
            </Col>
            <Col xs={3} >
              <Row>
                <Col xs={12}>
                  <KeyValue label="Borrower" value={getFullName(user)} />
                </Col>
              </Row>
            </Col>
            <Col xs={4}>
              <Row>
                <Col xs={12}>
                  <KeyValue label="Loan Date" value={formatDate(loan.loanDate, locale) || '-'} />
                </Col>
              </Row>
              <br />
              <Row>
                <Col xs={12}>
                  <KeyValue label="Due Date" value={futureDate(loan.loanDate, locale, 14) || '-'} />
                </Col>
              </Row>
            </Col>
          </Row>
          <br />
          <MultiColumnList
            id="list-loanactions"
            formatter={loanActionsFormatter}
            visibleColumns={['Action Date', 'Action', 'Due Date', 'Operator']}
            contentData={loanActionsHistory.records}
          />
        </Pane>
      </Paneset>
    );
  }
}

export default LoanActionsHistory;
