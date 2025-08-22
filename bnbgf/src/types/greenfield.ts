export interface Bucket {
    BucketInfo: {
      BucketName: string;
      Owner: string;
      Id: string;
      CreateAt: string;
      Visibility: number;
    };
  }
  
  export interface Object {
    ObjectInfo: {
      ObjectName: string;
      BucketName: string;
      Id: string;
      CreateAt: string;
      ObjectStatus: number;
      PayloadSize: string;
    };
  }