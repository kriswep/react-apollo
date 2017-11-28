import React, { Component } from 'react';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';

import { LINKS_PER_PAGE } from '../constants';
import Link from './Link';

// define query -> get all Links
export const ALL_LINKS_QUERY = gql`
  query AllLinksQuery($first: Int, $skip: Int, $orderBy: LinkOrderBy) {
    allLinks(first: $first, skip: $skip, orderBy: $orderBy) {
      id
      createdAt
      url
      description
      postedBy {
        id
        name
      }
      votes {
        id
        user {
          id
        }
      }
    }
    _allLinksMeta {
      count
    }
  }
`;

// const LinkList = ({ allLinksQuery }) => {
class LinkList extends Component {
  componentDidMount() {
    this.subscribeToNewLinks();
    this.subscribeToNewVotes();
  }

  updateCacheAfterVote = (store, createVote, linkId) => {
    const isNewPage = this.props.location.pathname.includes('new');
    const page = parseInt(this.props.match.params.page, 10);
    const skip = isNewPage ? (page - 1) * LINKS_PER_PAGE : 0;
    const first = isNewPage ? LINKS_PER_PAGE : 100;
    const orderBy = isNewPage ? 'createdAt_DESC' : null;
    const data = store.readQuery({
      query: ALL_LINKS_QUERY,
      variables: { first, skip, orderBy },
    });

    const votedLink = data.allLinks.find(link => link.id === linkId);
    votedLink.votes = createVote.link.votes;
    store.writeQuery({ query: ALL_LINKS_QUERY, data });
  };

  subscribeToNewLinks = () => {
    this.props.allLinksQuery.subscribeToMore({
      document: gql`
        subscription {
          Link(filter: { mutation_in: [CREATED] }) {
            node {
              id
              url
              description
              createdAt
              postedBy {
                id
                name
              }
              votes {
                id
                user {
                  id
                }
              }
            }
          }
        }
      `,
      updateQuery: (previous, { subscriptionData }) => {
        const newAllLinks = [
          ...previous.allLinks,
          subscriptionData.data.Link.node,
        ];
        const result = {
          ...previous,
          allLinks: newAllLinks,
        };
        return result;
      },
    });
  };

  subscribeToNewVotes = () => {
    this.props.allLinksQuery.subscribeToMore({
      document: gql`
        subscription {
          Vote(filter: { mutation_in: [CREATED] }) {
            node {
              id
              link {
                id
                url
                description
                createdAt
                postedBy {
                  id
                  name
                }
                votes {
                  id
                  user {
                    id
                  }
                }
              }
              user {
                id
              }
            }
          }
        }
      `,
      updateQuery: (previous, { subscriptionData }) => {
        const votedLinkIndex = previous.allLinks.findIndex(
          link => link.id === subscriptionData.data.Vote.node.link.id,
        );
        const link = subscriptionData.data.Vote.node.link;
        const newAllLinks = previous.allLinks.slice();
        newAllLinks[votedLinkIndex] = link;
        const result = {
          ...previous,
          allLinks: newAllLinks,
        };
        return result;
      },
    });
  };

  getLinksToRender = isNewPage => {
    if (isNewPage) {
      return this.props.allLinksQuery.allLinks;
    }
    const rankedLinks = this.props.allLinksQuery.allLinks.slice();
    rankedLinks.sort((l1, l2) => l2.votes.length - l1.votes.length);
    return rankedLinks;
  };

  nextPage = () => {
    const page = parseInt(this.props.match.params.page, 10);
    if (page <= this.props.allLinksQuery._allLinksMeta.count / LINKS_PER_PAGE) {
      const nextPage = page + 1;
      this.props.history.push(`/new/${nextPage}`);
    }
  };

  previousPage = () => {
    const page = parseInt(this.props.match.params.page, 10);
    if (page > 1) {
      const previousPage = page - 1;
      this.props.history.push(`/new/${previousPage}`);
    }
  };

  render() {
    // data still loading
    if (this.props.allLinksQuery && this.props.allLinksQuery.loading) {
      return <div>Loading</div>;
    }

    // error occured
    if (this.props.allLinksQuery && this.props.allLinksQuery.error) {
      return <div>Error</div>;
    }

    // render links
    const isNewPage = this.props.location.pathname.includes('new');
    const linksToRender = this.getLinksToRender(isNewPage);
    const page = parseInt(this.props.match.params.page, 10);

    return (
      <div>
        <div>
          {linksToRender.map((link, index) => (
            <Link
              key={link.id}
              index={page ? (page - 1) * LINKS_PER_PAGE + index : index}
              updateStoreAfterVote={this.updateCacheAfterVote}
              link={link}
            />
          ))}
        </div>
        {isNewPage && (
          <div className="flex ml4 mv3 gray">
            <div className="pointer mr2" onClick={() => this.previousPage()}>
              Previous
            </div>
            <div className="pointer" onClick={() => this.nextPage()}>
              Next
            </div>
          </div>
        )}
      </div>
    );
  }
}

// export wrapped in graphql container
export default graphql(ALL_LINKS_QUERY, {
  name: 'allLinksQuery',
  options: ownProps => {
    const page = parseInt(ownProps.match.params.page, 10);
    const isNewPage = ownProps.location.pathname.includes('new');
    const skip = isNewPage ? (page - 1) * LINKS_PER_PAGE : 0;
    const first = isNewPage ? LINKS_PER_PAGE : 100;
    const orderBy = isNewPage ? 'createdAt_DESC' : null;
    return {
      variables: { first, skip, orderBy },
    };
  },
})(LinkList);
